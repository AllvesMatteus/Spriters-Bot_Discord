const { Events } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const LocaleService = require('../services/LocaleService');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const guildId = interaction.guildId;
        const config = ConfigService.get(guildId);
        const lang = config.language;

        // Tratamento de Comandos
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
                return;
            }

            try {
                // Correção: Vincula 't' para preservar o contexto 'this' dentro de LocaleService
                await command.execute(interaction, { client, config, lang, t: LocaleService.t.bind(LocaleService) });
            } catch (error) {
                console.error(`Erro ao executar ${interaction.commandName}`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Houve um erro ao executar este comando!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Houve um erro ao executar este comando!', ephemeral: true });
                }
            }
        }
        // Outras interações (Botões, Menus)
        else {
            const interactionHandler = require('../handlers/centralInteractionHandler');
            // Correção: Vincula 't' aqui também
            await interactionHandler.handle(interaction, { client, config, lang, t: LocaleService.t.bind(LocaleService) });
        }
    },
};
