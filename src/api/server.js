const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");
const LocaleService = require('../services/LocaleService');

class WebServer {
    constructor(client) {
        this.client = client;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);
        this.port = process.env.PORT || 3000;

        this.setupRoutes();
        this.setupSocket();
    }

    setupRoutes() {
        // Serve arquivos estáticos
        // Utiliza process.cwd() para garantir que o caminho esteja correto independente de onde o script é iniciado
        const fs = require('fs');
        const rootDir = process.cwd();

        // Tenta localizar a pasta dist em caminhos prováveis
        const possiblePaths = [
            path.join(rootDir, 'frontend', 'dist'), // Padrão
            path.join(rootDir, 'dist'),             // Se o conteúdo for movido para a raiz
            path.join(__dirname, '../../frontend/dist') // Fallback relativo
        ];

        let distPath = possiblePaths.find(p => fs.existsSync(p));

        if (!distPath) {
            console.error(`[WebServer] ALERTA CRÍTICO: Pasta frontend/dist NÃO ENCONTRADA em nenhum dos locais esperados:`);
            possiblePaths.forEach(p => console.error(` - ${p}`));
            distPath = path.join(rootDir, 'frontend', 'dist'); // Define um padrão mesmo que falhe para exibir o erro 404 correto
        } else {
            console.log(`[WebServer] Servindo arquivos estáticos de: ${distPath}`);
        }

        this.app.use(express.static(distPath));

        // Status da API
        this.app.get('/api/status', (req, res) => {
            res.json({
                online: this.client.isReady(),
                uptime: process.uptime(),
                ping: this.client.isReady() ? this.client.ws.ping : -1
            });
        });

        // API Insulto (Localizada)
        this.app.get('/api/insulto', (req, res) => {
            const lang = req.query.lang || 'pt-BR';
            // Usa serviço de tradução para pegar um insulto aleatório
            const insulto = LocaleService.t('insults', lang);
            res.json({ text: insulto });
        });

        // Fallback para index.html para SPA
        this.app.get('*', (req, res) => {
            if (req.originalUrl.startsWith('/api')) return res.status(404).json({ error: 'Endpoint not found' });

            const indexPath = path.join(distPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).send(`
                    <div style="font-family: monospace; padding: 20px; background: #121212; color: #ff5555;">
                        <h1>Erro 404 - Frontend não encontrado</h1>
                        <p>O servidor backend está online, mas não conseguiu carregar o site (frontend).</p>
                        <hr style="border-color: #333;">
                        <p><strong>Diagnóstico:</strong></p>
                        <ul>
                            <li>Diretório Raiz (CWD): ${rootDir}</li>
                            <li>Caminho Tentado: ${distPath}</li>
                            <li>Existe? ${fs.existsSync(distPath) ? 'SIM' : 'NÃO'}</li>
                        </ul>
                        <p><strong>Solução para Render/Deploy:</strong></p>
                        <p>Verifique se o "Build Command" está configurado como: <code>npm run build</code></p>
                    </div>
                `);
            }
        });
    }

    setupSocket() {
        this.io.on('connection', (socket) => {
            if (this.client.isReady()) {
                socket.emit('system_log', `[SYSTEM] Status check: Bot Online e Operante.`);
            } else {
                socket.emit('system_log', `[SYSTEM] Bot OFFLINE.`);
            }
        });
    }

    start() {
        this.server.listen(this.port, '0.0.0.0', () => {
            console.log(`[WebServer] Running on port ${this.port}`);
        });
    }
}

module.exports = WebServer;
