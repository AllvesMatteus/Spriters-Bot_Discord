const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

class ExtendedClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.commands = new Collection();
        this.events = new Collection();
    }

    start(token) {
        this.loadHandlers();
        this.login(token);
    }

    loadHandlers() {
        this.loadCommands();
        this.loadEvents();
    }

    loadCommands() {
        // Leitura recursiva de comandos
        const readCommands = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    readCommands(fullPath);
                } else if (file.endsWith('.js')) {
                    const command = require(fullPath);
                    if (command.data && command.execute) {
                        this.commands.set(command.data.name, command);
                        console.log(`[Command] Loaded ${command.data.name}`);
                    } else {
                        console.warn(`[Command] Missing properties in ${file}`);
                    }
                }
            }
        };

        const commandsPath = path.join(__dirname, '../commands');
        if (fs.existsSync(commandsPath)) readCommands(commandsPath);
    }

    loadEvents() {
        const eventsPath = path.join(__dirname, '../events');
        if (!fs.existsSync(eventsPath)) return;

        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            if (event.name) {
                if (event.once) {
                    this.once(event.name, (...args) => event.execute(...args, this));
                } else {
                    this.on(event.name, (...args) => event.execute(...args, this));
                }
                console.log(`[Event] Loaded ${event.name}`);
            }
        }
    }
}

module.exports = ExtendedClient;
