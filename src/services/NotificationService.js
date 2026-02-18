const ConfigService = require('./ConfigService');
const LocaleService = require('./LocaleService');
const { EmbedBuilder } = require('discord.js');

const NotificationService = {
    async notify(client, guildId, actionType, user, details) {
        const config = ConfigService.get(guildId);

        // Verifica se as notificações estão ativadas e o canal definido
        const channelId = config.security?.notificationChannel;
        if (!channelId) return;

        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        const lang = config.language || 'pt-BR';

        // Constrói mensagem localizada
        // "notifications.admin_alert": "📢 **NOTIFICAÇÃO ADMINISTRATIVA**\n**Ação:** {action}\n**Autor:** {user}\n**Detalhes:** {details}",

        const actionLabel = LocaleService.t(`log_types.${actionType}`, lang) || actionType;

        const description = LocaleService.t('notifications.admin_alert', lang, {
            action: actionLabel,
            user: user?.tag || user?.username || 'System',
            details: details
        });

        const embed = new EmbedBuilder()
            .setColor('#FFA500') // Orange for alert
            .setDescription(description)
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('[NotificationService] Failed to send notification:', error);
        }
    }
};

module.exports = NotificationService;
