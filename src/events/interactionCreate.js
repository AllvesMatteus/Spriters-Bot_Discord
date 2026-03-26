const { Events, MessageFlags } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const LocaleService = require('../services/LocaleService');
const interactionHandler = require('../handlers/centralInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // RESPOSTA IMEDIATA: Apenas para comandos de chat (slash commands)
        // NÃO fazer deferUpdate em botões/menus pois conflita com showModal e update
        if (interaction.isChatInputCommand()) {
            try {
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            } catch (e) {
                console.error(`[InteractionCreate] ❌ Erro no Defer (${interaction.id}): ${e.message}`);
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
                console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
                return;
            }

            try {
                await command.execute(interaction, { client, config, lang, t });
            } catch (error) {
                console.error(`Erro ao executar /${interaction.commandName}`, error);
                
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.followUp({ content: '❌ Erro interno ao processar este comando.', flags: [MessageFlags.Ephemeral] });
                    }
                } catch (e) {
                    console.error('Falha ao reportar erro:', e.message);
                }
            }
        } else {
            try {
                await interactionHandler.handle(interaction, { client, config, lang, t });
            } catch (error) {
                console.error('Erro no centralInteractionHandler:', error);
            }
        }
    },
};
