const ConfigService = require('./ConfigService');
const PermissionService = require('./PermissionService');
const LogService = require('./LogService');
const NotificationService = require('./NotificationService');
const LocaleService = require('./LocaleService');
const { Collection } = require('discord.js');

class AntiSpamService {
    constructor() {
        this.cache = new Collection();
        this.punishedCooldowns = new Set();
    }

    async handleMessage(message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const config = ConfigService.get(message.guild.id);
        const spamConfig = config.antispam || {};

        if (!spamConfig.enabled) return;

        if (PermissionService.canManageBot(message.member)) return;

        const key = `${message.guild.id}-${message.author.id}`;

        if (this.punishedCooldowns.has(key)) return;

        if (!this.cache.has(key)) {
            this.cache.set(key, []);
        }

        const userHistory = this.cache.get(key);
        const now = Date.now();

        userHistory.push({ content: message.content, timestamp: now });

        const windowSize = 5000;
        const limit = spamConfig.floodLimit || 5;

        const recentMessages = userHistory.filter(m => now - m.timestamp < windowSize);
        this.cache.set(key, recentMessages);

        if (recentMessages.length > limit) {
            await this.punish(message, 'flood', config, key);
            return;
        }

        if (recentMessages.length >= 3) {
            const last3 = recentMessages.slice(-3);
            if (last3.every(m => m.content === last3[0].content)) {
                await this.punish(message, 'repetition', config, key);
                return;
            }
        }

        if (spamConfig.blockLinks) {
            const linkRegex = /(https?:\/\/[^\s]+)/g;
            if (linkRegex.test(message.content)) {
                await this.punish(message, 'link', config, key);
                return;
            }
        }
    }

    async punish(message, reason, config, key) {
        if (this.punishedCooldowns.has(key)) return;

        this.punishedCooldowns.add(key);
        this.cache.delete(key);

        setTimeout(() => this.punishedCooldowns.delete(key), 10000);

        const lang = config.language || 'pt-BR';
        const actions = config.antispam?.actions || ['delete'];

        try {
            if (actions.includes('delete')) {
                if (message.deletable) await message.delete().catch(() => { });
            }

            if (actions.includes('mute')) {
                if (message.member.moderatable) {
                    await message.member.timeout(60 * 1000, 'Anti-Spam Acionado').catch(() => { });
                }
            }

            const alertMsg = LocaleService.t('antispam.alert', lang, { user: message.author.toString() });
            const alertToChat = await message.channel.send(alertMsg);

            setTimeout(() => alertToChat.delete().catch(() => { }), 5000);

            const actionText = actions.join(', ');
            LogService.add(message.guild.id, {
                type: LogService.Events.ANTISPAM_TRIGGERED,
                user: message.author,
                channelId: message.channel.id,
                description: LocaleService.t('menus.logs.descriptions.antispam_triggered', lang, {
                    user: message.author.tag,
                    reason: reason,
                    actions: actionText
                }),
                metadata: { reason, actions: actionText }
            });

            NotificationService.notify(
                message.client,
                message.guild.id,
                'spam_detected',
                message.author,
                `Motivo: ${reason} | Ações: ${actionText}`
            );

        } catch (error) {
            console.error('[AntiSpam] Erro ao punir:', error);
        }
    }
}

module.exports = new AntiSpamService();
