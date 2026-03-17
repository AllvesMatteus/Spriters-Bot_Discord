const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const CleaningService = require('../../services/CleaningService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from the current channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(false)
        ),
    async execute(interaction, { t, lang }) {

        if (!PermissionService.canManageBot(interaction.member)) {
            return interaction.editReply({ content: t('errors.permission_denied', lang) });
        }

        const amount = interaction.options.getInteger('amount') || 100;


        const config = require('../../services/ConfigService').get(interaction.guildId);
        const channelConfig = config.cleaning?.[interaction.channelId] || {};
        const filters = channelConfig.filters || ['all'];

        await interaction.editReply({ content: t('commands.clean.start', lang) });

        const deletedCount = await CleaningService.cleanChannel(
            interaction.client,
            interaction.channelId,
            { limit: amount, filters: filters }
        );

        await interaction.followUp({
            content: t('commands.clean.done', lang, { count: deletedCount }),
            ephemeral: true
        });
    },
};
