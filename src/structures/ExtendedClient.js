const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

class ExtendedClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction
            ]
        });

        this.commands = new Collection();
        this.events = new Collection();

        // Listeners de diagnóstico do Gateway
        this.on('error', (err) => console.error('[Discord] ❌ Client Error:', err.message));
        this.on('warn', (info) => console.warn('[Discord] ⚠️ Warning:', info));
        this.on('shardError', (err, id) => console.error(`[Discord] ❌ Shard ${id} Error:`, err.message));
        this.on('invalidated', () => {
            console.error('[Discord] 💀 Sessão INVALIDADA. Token pode estar expirado ou revogado.');
            process.exit(1);
        });
    }

    start(token) {
        this.loadHandlers();
        console.log('[ExtendedClient] Iniciando login no Discord...');
        const loginStart = Date.now();

        // Timeout para mostrar se o login está pendurado
        const loginTimeout = setTimeout(() => {
            console.error(`[ExtendedClient] ⏰ Login está demorando mais de 60s. Possível rate-limit do Gateway.`);
        }, 60000);

        return this.login(token)
            .then(() => {
                clearTimeout(loginTimeout);
                console.log(`[ExtendedClient] ✅ Login bem-sucedido em ${Date.now() - loginStart}ms`);
            })
            .catch(err => {
                clearTimeout(loginTimeout);
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
