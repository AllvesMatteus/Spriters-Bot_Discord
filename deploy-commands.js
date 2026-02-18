const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error('Missing TOKEN or CLIENT_ID in .env');
    process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');

function readCommands(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            readCommands(fullPath);
        } else if (file.endsWith('.js')) {
            const command = require(fullPath);
            if (command.data && command.data.toJSON) {
                commands.push(command.data.toJSON());
                console.log(`[Deploy] Discovered /${command.data.name}`);
            }
        }
    }
}

if (fs.existsSync(commandsPath)) {
    readCommands(commandsPath);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Comandos globais
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
