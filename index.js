require('dotenv').config();
const ExtendedClient = require('./src/structures/ExtendedClient');

// Verificação de segurança para o Render
if (!process.env.TOKEN && !process.env.DISCORD_TOKEN) {
    console.error('❌ ERRO FATAL: Token (TOKEN) não encontrado nas variáveis de ambiente do Render.');
    process.exit(1);
}

const client = new ExtendedClient();

// --- SERVIDOR WEB INTEGRADO (DASHBOARD + KEEP-ALIVE) ---
// Usamos o WebServer do projeto que já lida com Socket.io, Dashboard e API.
try {
    const WebServer = require('./src/api/server');
    const webServer = new WebServer(client);
    webServer.start();
} catch (e) {
    console.error('❌ Erro ao iniciar o WebServer:', e.message);
}

process.on('SIGINT', () => {
    console.log('Desligando bot e servidor...');
    client.destroy();
    process.exit(0);
});

// Inicializa o Bot
client.start(process.env.TOKEN || process.env.DISCORD_TOKEN);

// Módulo de KeepAlive (Faz o ping para evitar hibernação do Render)
try {
    const startKeepAlive = require('./src/utils/keepAlive');
    startKeepAlive();
} catch (e) {
    console.log('[Info] keepAlive não configurado ou ausente.');
}
