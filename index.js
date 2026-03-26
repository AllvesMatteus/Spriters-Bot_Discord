require('dotenv').config();
const ExtendedClient = require('./src/structures/ExtendedClient');

if (!process.env.TOKEN && !process.env.DISCORD_TOKEN) {
    console.error('❌ ERRO FATAL: Token (TOKEN) não encontrado nas variáveis de ambiente do Render.');
    process.exit(1);
}

const client = new ExtendedClient();

// PRIORIDADE 1: Conectar ao Discord IMEDIATAMENTE
console.log('[Sistema] Iniciando conexão com o Discord...');
client.start(process.env.TOKEN || process.env.DISCORD_TOKEN);

// PRIORIDADE 2: Servidor Web (Dashboard + KeepAlive endpoint)
try {
    const WebServer = require('./src/api/server');
    const webServer = new WebServer(client);
    webServer.start();
} catch (e) {
    console.error('❌ Erro ao iniciar o WebServer:', e.message);
}

// PRIORIDADE 3: KeepAlive (Ping periódico)
try {
    const startKeepAlive = require('./src/utils/keepAlive');
    startKeepAlive();
} catch (e) {
    console.log('[Info] keepAlive não configurado ou ausente.');
}

process.on('SIGINT', () => {
    console.log('Desligando bot e servidor...');
    client.destroy();
    process.exit(0);
});
