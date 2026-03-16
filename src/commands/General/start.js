const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start the bot control panel.'),
    async execute(interaction, { t, lang }) {
        const embed = new EmbedBuilder()
            .setTitle(t('menus.main.embed_title', lang))
            .setDescription(t('commands.setup.start_description', lang))
            .setColor('#9933ff')
            .addFields(
                { name: 'Status', value: t('system.status', lang), inline: true }
            );

        const select = new StringSelectMenuBuilder()
            .setCustomId('menu_main_select')
            .setPlaceholder(t('menus.main.placeholder', lang))
            .addOptions([
                { 
                    label: t('menus.main.options.cleaning_label', lang), 
                    description: t('menus.main.options.cleaning_desc', lang), 
                    value: 'cleaning', 
                    emoji: '🧹' 
                },
                { 
                    label: t('menus.main.options.antispam_label', lang), 
                    description: t('menus.main.options.antispam_desc', lang), 
                    value: 'antispam', 
                    emoji: '🛡️' 
                },
                { 
                    label: t('menus.main.options.logs_label', lang), 
                    description: t('menus.main.options.logs_desc', lang), 
                    value: 'logs', 
                    emoji: '📝' 
                },
                { 
                    label: t('menus.main.options.permissions_label', lang), 
                    description: t('menus.main.options.permissions_desc', lang), 
                    value: 'security', 
                    emoji: '👮' 
                },
                { 
                    label: t('menus.main.options.dates_label', lang), 
                    description: t('menus.main.options.dates_desc', lang), 
                    value: 'dates', 
                    emoji: '📅' 
                },
                { label: 'Idioma / Language', description: 'Change language / Alterar idioma', value: 'language', emoji: '🗣️' },
            ]);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.editReply({
            content: t('commands.setup.welcome_msg', lang),
            embeds: [embed],
            components: [row]
        });
    },
};
