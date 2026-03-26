const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

class ExtendedClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,           // Permissões básicas de servidor
                GatewayIntentBits.GuildMessages,    // Monitorar mensagens em canais
                GatewayIntentBits.MessageContent,   // CRUCIAL: Ler o conteúdo das mensagens
                GatewayIntentBits.GuildMembers,     // Monitorar entrada/saída de membros
                GatewayIntentBits.GuildPresences    // Monitorar status online/offline
            ],
            partials: [
                Partials.Message,  // Permite lidar com mensagens enviadas antes do bot ligar
                Partials.Channel,  // Permite lidar com canais não cacheados
                Partials.Reaction  // Permite lidar com reações em mensagens antigas
            ]
        });

        this.commands = new Collection();
        this.events = new Collection();
    }

    start(token) {
        this.loadHandlers();
        return this.login(token).catch(err => {
            console.error('[ExtendedClient] ❌ FALHA NO LOGIN:', err.message);
            process.exit(1);
        });
    }

    loadHandlers() {
        this.loadCommands();
        this.loadEvents();
    }

    loadCommands() {
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
