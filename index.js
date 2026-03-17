require('dotenv').config();
const ExtendedClient = require('./src/structures/ExtendedClient');

if (!process.env.TOKEN && !process.env.DISCORD_TOKEN) {
    console.error('❌ ERRO FATAL: Token não encontrado. Configure o .env');
    process.exit(1);
}

const client = new ExtendedClient();

process.on('SIGINT', () => {
    console.log('Desligando...? Finalmente.');
    client.destroy();
    process.exit(0);
});

client.start(process.env.TOKEN || process.env.DISCORD_TOKEN);

const WebServer = require('./src/api/server');
const webServer = new WebServer(client);
webServer.start();

const startKeepAlive = require('./src/utils/keepAlive');
startKeepAlive();
