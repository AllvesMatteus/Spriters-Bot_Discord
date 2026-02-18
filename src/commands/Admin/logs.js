const { SlashCommandBuilder } = require('discord.js');
const CentralInteractionHandler = require('../../handlers/centralInteractionHandler');
const PermissionService = require('../../services/PermissionService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Exibe os logs do sistema.'),
    async execute(interaction, { t, lang }) {
        if (!PermissionService.canManageBot(interaction.member)) {
            return interaction.reply({ content: t('errors.permission_denied', lang), ephemeral: true });
        }

        const context = {
            client: interaction.client,
            config: require('../../services/ConfigService').get(interaction.guildId),
            lang,
            t
        };

        await CentralInteractionHandler.showLogsMenu(interaction, context);
    },
};
