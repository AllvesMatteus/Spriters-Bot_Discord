require('dotenv').config();
const ExtendedClient = require('./src/structures/ExtendedClient');

// Validação
if (!process.env.TOKEN && !process.env.DISCORD_TOKEN) {
    console.error('❌ ERRO FATAL: Token não encontrado. Configure o .env');
    process.exit(1);
}

const client = new ExtendedClient();

// Lida com sinal de encerramento graciosamente
process.on('SIGINT', () => {
    console.log('Desligando...? Finalmente.');
    client.destroy();
    process.exit(0);
});

// Inicia o bot
client.start(process.env.TOKEN || process.env.DISCORD_TOKEN);

// Inicia Servidor Web
const WebServer = require('./src/api/server');
const webServer = new WebServer(client);
webServer.start();
