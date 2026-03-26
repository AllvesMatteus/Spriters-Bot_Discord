const { Events, MessageFlags } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const LocaleService = require('../services/LocaleService');
const interactionHandler = require('../handlers/centralInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        console.log(`[InteractionCreate] 📩 Recebida: tipo=${interaction.type}, comando=${interaction.commandName || interaction.customId || 'N/A'}`);

        if (interaction.isChatInputCommand()) {
            try {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                console.log(`[InteractionCreate] ✅ Defer OK para /${interaction.commandName}`);
            } catch (e) {
                console.error(`[InteractionCreate] ❌ Defer FALHOU para /${interaction.commandName}: ${e.message}`);
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
                console.error(`[InteractionCreate] Comando /${interaction.commandName} NÃO encontrado na Collection!`);
                return;
            }

            try {
                console.log(`[InteractionCreate] Executando /${interaction.commandName}...`);
                await command.execute(interaction, { client, config, lang, t });
                console.log(`[InteractionCreate] ✅ /${interaction.commandName} executado com sucesso`);
            } catch (error) {
                console.error(`[InteractionCreate] ❌ Erro ao executar /${interaction.commandName}:`, error);

                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.followUp({ content: '❌ Erro interno ao processar este comando.', flags: MessageFlags.Ephemeral });
                    }
                } catch (e) {
                    console.error('[InteractionCreate] Falha ao reportar erro:', e.message);
                }
            }
        } else {
            try {
                await interactionHandler.handle(interaction, { client, config, lang, t });
            } catch (error) {
                console.error('[InteractionCreate] Erro no handler:', error);
            }
        }
    },
};
