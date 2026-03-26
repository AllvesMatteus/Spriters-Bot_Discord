require('dotenv').config();
const express = require('express');
const ExtendedClient = require('./src/structures/ExtendedClient');

// Verificação de segurança para o Render
if (!process.env.TOKEN && !process.env.DISCORD_TOKEN) {
    console.error('❌ ERRO FATAL: Token (TOKEN) não encontrado nas variáveis de ambiente do Render.');
    process.exit(1);
}

const client = new ExtendedClient();

// --- SERVIDOR HTTP PARA O RENDER (MANTÉM O BOT ONLINE) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Spriters Bot Operacional');
});

// Suporte para o WebServer antigo do bot (se necessário)
try {
    const WebServer = require('./src/api/server');
    const webServer = new WebServer(client);
    webServer.start();
} catch (e) {
    console.log('[Info] Usando o servidor HTTP simplificado do index.js');
}

app.listen(PORT, () => {
    console.log(`[Render] Servidor HTTP escutando na porta ${PORT}`);
});
// ---------------------------------------------------------

process.on('SIGINT', () => {
    console.log('Desligando bot e servidor...');
    client.destroy();
    process.exit(0);
});

// Inicializa o Bot
client.start(process.env.TOKEN || process.env.DISCORD_TOKEN);

// Outros módulos secundários (KeepAlive)
try {
    const startKeepAlive = require('./src/utils/keepAlive');
    startKeepAlive();
} catch (e) {
    console.log('[Info] keepAlive não configurado ou ausente.');
}
