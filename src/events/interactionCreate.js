const { Events } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const LocaleService = require('../services/LocaleService');
const interactionHandler = require('../handlers/centralInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const receivedAt = Date.now();
        const latency = receivedAt - interaction.createdTimestamp;

        console.log(`[InteractionCreate] 📩 tipo=${interaction.type} cmd=${interaction.commandName || interaction.customId || 'N/A'} latency=${latency}ms`);

        // Se a interação já está muito velha (mais de 2.5s), o Discord vai rejeitar qualquer resposta
        if (latency > 2500) {
            console.warn(`[InteractionCreate] ⏰ Interação EXPIRADA (${latency}ms). Descartando.`);
            return;
        }

        if (interaction.isChatInputCommand()) {
            try {
                // Usar ephemeral: true (formato legado mas mais compatível)
                const deferStart = Date.now();
                await interaction.deferReply({ ephemeral: true });
                console.log(`[InteractionCreate] ✅ Defer OK para /${interaction.commandName} em ${Date.now() - deferStart}ms`);
            } catch (e) {
                console.error(`[InteractionCreate] ❌ Defer FALHOU: [${e.code}] ${e.message}`);
                return;
            }
        }

        const guildId = interaction.guildId;
        const config = ConfigService.get(guildId);
        const lang = config.language || 'pt-BR';
        const t = LocaleService.t.bind(LocaleService);

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`[InteractionCreate] Comando /${interaction.commandName} não encontrado.`);
                return;
            }

            try {
                console.log(`[InteractionCreate] ▶️ Executando /${interaction.commandName}...`);
                await command.execute(interaction, { client, config, lang, t });
                console.log(`[InteractionCreate] ✅ /${interaction.commandName} OK (total: ${Date.now() - receivedAt}ms)`);
            } catch (error) {
                console.error(`[InteractionCreate] ❌ Erro em /${interaction.commandName}:`, error.message);
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.followUp({ content: '❌ Erro interno ao processar este comando.', ephemeral: true });
                    }
                } catch (e) { /* ignore */ }
            }
        } else {
            try {
                await interactionHandler.handle(interaction, { client, config, lang, t });
            } catch (error) {
                console.error('[InteractionCreate] ❌ Handler error:', error.message);
            }
        }
    },
};
