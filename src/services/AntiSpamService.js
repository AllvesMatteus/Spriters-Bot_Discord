const ConfigService = require('./ConfigService');
const PermissionService = require('./PermissionService');
const LogService = require('./LogService');
const NotificationService = require('./NotificationService');
const LocaleService = require('./LocaleService');
const { Collection } = require('discord.js');

class AntiSpamService {
    constructor() {
        // Mapeamento: guildId -> userId -> Array de { conteúdo, timestamp }
        this.cache = new Collection();
        // Conjunto de strings "guildId-userId" em tempo de espera após punição
        this.punishedCooldowns = new Set();
    }

    async handleMessage(message) {
        if (message.author.bot) return; // Ignora bots
        if (!message.guild) return;

        const config = ConfigService.get(message.guild.id);
        const spamConfig = config.antispam || {};

        if (!spamConfig.enabled) return;

        // Administradores são imunes
        if (PermissionService.canManageBot(message.member)) return;

        const key = `${message.guild.id}-${message.author.id}`;

        // Debounce: Se o usuário estiver em tempo de espera de punição, ignora completamente
        if (this.punishedCooldowns.has(key)) return;

        if (!this.cache.has(key)) {
            this.cache.set(key, []);
        }

        const userHistory = this.cache.get(key);
        const now = Date.now();

        userHistory.push({ content: message.content, timestamp: now });

        // Limpeza: Remove mensagens mais antigas que 5 segundos (janela de tempo)
        const windowSize = 5000;
        const limit = spamConfig.floodLimit || 5;

        // Filtra mensagens válidas na janela
        const recentMessages = userHistory.filter(m => now - m.timestamp < windowSize);
        // Otimização: Atualiza cache apenas com mensagens válidas para evitar crescimento do array
        this.cache.set(key, recentMessages);

        // Verificação 1: Flood
        if (recentMessages.length > limit) {
            await this.punish(message, 'flood', config, key);
            return;
        }

        // Verificação 2: Repetição (3 últimas mensagens com mesmo conteúdo)
        if (recentMessages.length >= 3) {
            const last3 = recentMessages.slice(-3);
            if (last3.every(m => m.content === last3[0].content)) {
                await this.punish(message, 'repetition', config, key);
                return;
            }
        }

        // Verificação 3: Links (se ativado)
        if (spamConfig.blockLinks) {
            const linkRegex = /(https?:\/\/[^\s]+)/g;
            if (linkRegex.test(message.content)) {
                await this.punish(message, 'link', config, key);
                return;
            }
        }
    }

    async punish(message, reason, config, key) {
        // Verificação dupla de tempo de espera
        if (this.punishedCooldowns.has(key)) return;

        // Adiciona ao tempo de espera imediatamente
        this.punishedCooldowns.add(key);
        // Limpa o cache imediatamente para prevenir novos gatilhos
        this.cache.delete(key);

        // Remove do tempo de espera após 10 segundos
        setTimeout(() => this.punishedCooldowns.delete(key), 10000);

        const lang = config.language || 'pt-BR';
        const actions = config.antispam?.actions || ['delete'];

        try {
            // Ação: Deletar
            if (actions.includes('delete')) {
                if (message.deletable) await message.delete().catch(() => { });
            }

            // Ação: Silenciar (Timeout 60s)
            if (actions.includes('mute')) {
                if (message.member.moderatable) {
                    await message.member.timeout(60 * 1000, 'Anti-Spam Acionado').catch(() => { });
                }
            }

            // Enviar alerta ao usuário
            const alertMsg = LocaleService.t('antispam.alert', lang, { user: message.author.toString() });
            const alertToChat = await message.channel.send(alertMsg);

            // Deletar alerta após 5s
            setTimeout(() => alertToChat.delete().catch(() => { }), 5000);

            // Registrar log e notificar
            const actionText = actions.join(', ');
            LogService.add(message.guild.id, 'antispam_trigger', message.author.tag, `Motivo: ${reason}, Ações: ${actionText}`);

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
