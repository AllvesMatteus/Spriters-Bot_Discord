const { Events, ActivityType, REST, Routes } = require('discord.js');
const DateService = require('../services/DateService');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        client.user.setActivity('julgando vocês', { type: ActivityType.Playing });

        // Registra os Slash Commands automaticamente no Discord
        try {
            const TOKEN = process.env.TOKEN;
            const CLIENT_ID = process.env.CLIENT_ID;

            if (TOKEN && CLIENT_ID) {
                const commands = client.commands.map(cmd => cmd.data.toJSON());
                const rest = new REST({ version: '10' }).setToken(TOKEN);

                console.log(`[Deploy] Registrando ${commands.length} slash commands no Discord...`);
                await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
                console.log(`[Deploy] ✅ ${commands.length} slash commands registrados com sucesso!`);
            } else {
                console.warn('[Deploy] ⚠️ CLIENT_ID não encontrado. Comandos NÃO registrados.');
            }
        } catch (err) {
            console.error('[Deploy] ❌ Falha ao registrar slash commands:', err.message);
        }

        DateService.init(client);

        const CleaningService = require('../services/CleaningService');
        CleaningService.initScheduler(client);
    },
};
