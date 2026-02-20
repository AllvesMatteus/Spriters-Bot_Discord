const { ChannelType } = require('discord.js');
const ConfigService = require('./ConfigService');
const LogService = require('./LogService');
const NotificationService = require('./NotificationService');

class CleaningService {
    constructor() {
        this.activeIntervals = {};
        this.schedulerInterval = null; // Timer global de agendamento
    }

    /**
     * Limpa mensagens de um canal com filtros opcionais
     * @param {Client} client 
     * @param {string} channelId 
     * @param {object} options { limit: 100, filters: ['bots', 'links'], exclusions: { ignorePinned: true, ignoreBots: false, minReactions: 0, ignoreRoles: [], minAge: 0 } }
     */
    async cleanChannel(client, channelId, options = {}) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) return 0;

            const limit = options.limit || 100;
            const fetched = await channel.messages.fetch({ limit });

            // Exclusões / Proteções
            const exclusions = options.exclusions || {};
            const ignorePinned = exclusions.ignorePinned !== false;
            const ignoreSystem = exclusions.ignoreSystem !== false;
            const ignoreBots = exclusions.ignoreBots || false;
            const minReactions = exclusions.minReactions || 0;
            const ignoreRoles = exclusions.ignoreRoles || [];
            const minAgeMinutes = exclusions.minAge !== undefined ? exclusions.minAge : 5;

            // Filtros
            const messagesToDelete = fetched.filter(msg => {
                const filters = options.filters || [];

                // PROTEÇÕES DO SISTEMA
                if (ignorePinned && msg.pinned) return false;
                if (ignoreSystem && msg.system) return false;
                if (ignoreBots && msg.author.bot) return false;
                if (minReactions > 0 && msg.reactions.cache.size >= minReactions) return false;
                if (ignoreRoles.length > 0 && msg.member && msg.member.roles.cache.some(r => ignoreRoles.includes(r.id))) return false;

                // Idade Mínima
                if (minAgeMinutes > 0) {
                    const ageMs = Date.now() - msg.createdTimestamp;
                    if (ageMs < minAgeMinutes * 60000) return false;
                }

                // FILTROS DE EXCLUSÃO
                if (filters.length === 0 || filters.includes('all')) return true;

                let matches = false;
                if ((filters.includes('bots') || filters.includes('bot')) && msg.author.bot) matches = true;
                if ((filters.includes('links') || filters.includes('link')) && /https?:\/\//.test(msg.content)) matches = true;
                if ((filters.includes('embeds') || filters.includes('embed')) && msg.embeds.length > 0) matches = true;
                if ((filters.includes('files') || filters.includes('file')) && msg.attachments.size > 0) matches = true;

                return matches;
            });

            if (messagesToDelete.size > 0) {
                await channel.bulkDelete(messagesToDelete, true);

                const trigger = options.trigger || 'manual';
                const guildId = channel.guildId;

                let logType = LogService.Events.CLEAN_EXECUTED_MANUAL;
                if (trigger === 'auto') logType = LogService.Events.CLEAN_EXECUTED_AUTO;
                if (trigger === 'scheduled') logType = LogService.Events.CLEAN_EXECUTED_SCHEDULED;

                const filtersUsed = (options.filters || ['all']).join(', ');

                const config = ConfigService.get(guildId);
                const lang = config.language || 'pt-BR';

                let logDescKey = 'logs.descriptions.clean_manual';
                if (trigger === 'auto') logDescKey = 'logs.descriptions.clean_auto';
                if (trigger === 'scheduled') logDescKey = 'logs.descriptions.clean_scheduled';

                const logDescription = LocaleService.t(logDescKey, lang, {
                    channel: channel.name,
                    count: messagesToDelete.size,
                    filters: filtersUsed
                });

                LogService.add(guildId, {
                    type: logType,
                    user: options.user || null,
                    channelId: channel.id,
                    description: logDescription,
                    metadata: { count: messagesToDelete.size, filters: filtersUsed }
                });

                if (trigger === 'auto' || options.notify) {
                    NotificationService.notify(client, guildId, logType, client.user, `Canal: ${channel.name}, Deletadas: ${messagesToDelete.size} msgs.`);
                }

                // RELATÓRIO DE LIMPEZA
                const reportEnabled = config.notifications?.cleaningReport?.enabled || false;

                if (reportEnabled) {
                    const LocaleService = require('./LocaleService');
                    const { EmbedBuilder } = require('discord.js');
                    const lang = config.language || 'pt-BR';
                    const t = (key, params) => LocaleService.t(key, lang, params);

                    const channelConfig = config.cleaning?.[channelId] || {};
                    const exclusions = channelConfig.exclusions || {};
                    const ignorePinned = exclusions.ignorePinned !== false;
                    const ignoreBots = exclusions.ignoreBots || false;
                    const minReactions = exclusions.minReactions || 0;
                    const ignoreRoles = exclusions.ignoreRoles || [];
                    const minAge = exclusions.minAge !== undefined ? exclusions.minAge : 5;

                    const schedule = channelConfig.schedule || {};
                    let scheduleText = t('cleaning_report.schedule_24h');
                    if (schedule.mode === 'daily') {
                        scheduleText = `Diário às ${schedule.time}`;
                    } else if (schedule.mode === 'interval') {
                        scheduleText = `A cada ${schedule.intervalDays} dias às ${schedule.time}`;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(t('cleaning_report.title'))
                        .setColor('#00FF00')
                        .addFields(
                            { name: t('cleaning_report.deleted'), value: `${messagesToDelete.size}`, inline: true },
                            { name: t('cleaning_report.auto'), value: trigger === 'auto' ? 'ON' : 'OFF', inline: true },
                            { name: t('cleaning_report.schedule'), value: scheduleText, inline: true },
                            { name: t('cleaning_report.pinned'), value: ignorePinned ? 'ON' : 'OFF', inline: true },
                            { name: t('cleaning_report.bots'), value: ignoreBots ? 'ON' : 'OFF', inline: true },
                            { name: t('cleaning_report.recent'), value: minAge > 0 ? `< ${minAge} min` : 'OFF', inline: true },
                            { name: t('cleaning_report.reactions'), value: minReactions > 0 ? `> ${minReactions}` : 'OFF', inline: true },
                            { name: t('cleaning_report.roles'), value: ignoreRoles.length > 0 ? `${ignoreRoles.length}` : t('status.roles_none'), inline: true },
                            { name: t('cleaning_report.time'), value: new Date().toLocaleTimeString('pt-BR', { timeZone: config.timezone || 'UTC' }) + ` ${config.timezone || 'UTC'}`, inline: true }
                        );

                    await channel.send({ embeds: [embed] }).catch(() => { });
                }
            }

            return messagesToDelete.size;

        } catch (error) {
            console.error('[CleaningService] Erro:', error);
            throw error;
        }
    }

    /**
     * NOVO: Inicializa o scheduler global que verifica todos os agendamentos
     */
    initScheduler(client) {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
        }

        console.log('[CleaningService] Iniciando scheduler global (verifica a cada 1 minuto)...');

        // Verifica a cada 1 minuto se algum agendamento deve executar
        this.schedulerInterval = setInterval(() => {
            this.checkScheduledCleanings(client);
        }, 60000); // 60 segundos

        // Executa verificação imediata ao iniciar
        this.checkScheduledCleanings(client);
    }

    /**
     * NOVO: Verifica todos os canais com agendamento ativo e executa se necessário
     */
    async checkScheduledCleanings(client) {
        try {
            const guilds = client.guilds.cache.map(g => g.id);

            for (const guildId of guilds) {
                const config = ConfigService.get(guildId);
                if (!config || !config.cleaning) continue;

                const timezone = config.timezone || 'UTC';
                const currentTime = this.getCurrentTime(timezone);
                const currentDate = this.getCurrentDate(timezone);

                for (const [channelId, channelConfig] of Object.entries(config.cleaning)) {
                    if (!channelConfig.active || !channelConfig.schedule) continue;

                    const schedule = channelConfig.schedule;

                    if (this.shouldRunNow(schedule, currentTime, currentDate)) {
                        console.log(`[CleaningService] Executando limpeza agendada: ${channelId} às ${currentTime}`);

                        await this.cleanChannel(client, channelId, {
                            limit: 100,
                            filters: channelConfig.filters || ['all'],
                            exclusions: channelConfig.exclusions || {},
                            trigger: 'scheduled'
                        });

                        // Atualiza lastRun se for modo interval
                        if (schedule.mode === 'interval') {
                            schedule.lastRun = currentDate;
                            const cleaning = config.cleaning || {};
                            cleaning[channelId].schedule = schedule;
                            ConfigService.update(guildId, { cleaning });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[CleaningService] Erro no scheduler:', error);
        }
    }

    /**
     * NOVO: Verifica se o agendamento deve executar agora
     */
    shouldRunNow(schedule, currentTime, currentDate) {
        if (!schedule || !schedule.time) return false;

        // Normaliza tempo (remove segundos se existir)
        const scheduleTime = schedule.time.substring(0, 5); // "22:00"
        const nowTime = currentTime.substring(0, 5);

        if (schedule.mode === 'daily') {
            // Executa se o horário atual for igual ao horário agendado
            return nowTime === scheduleTime;
        }

        if (schedule.mode === 'interval') {
            // Executa se: (horário atual == horário agendado) E (dias desde lastRun >= intervalo)
            if (nowTime !== scheduleTime) return false;

            const daysSince = this.calculateDaysSince(schedule.lastRun, currentDate);
            return daysSince >= (schedule.intervalDays || 1);
        }

        return false;
    }

    /**
     * NOVO: Calcula diferença de dias entre duas datas
     */
    calculateDaysSince(lastRunDate, currentDate) {
        if (!lastRunDate) return 999; // Se nunca executou, força execução

        const last = new Date(lastRunDate);
        const now = new Date(currentDate);

        const diffMs = now - last;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    /**
     * NOVO: Obtém horário atual no timezone especificado (formato HH:mm)
     */
    getCurrentTime(timezone) {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(new Date());
        const hour = parts.find(p => p.type === 'hour').value;
        const minute = parts.find(p => p.type === 'minute').value;

        return `${hour}:${minute}`;
    }

    /**
     * NOVO: Obtém data atual no timezone especificado (formato YYYY-MM-DD)
     */
    getCurrentDate(timezone) {
        const formatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' usa formato ISO
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        return formatter.format(new Date()); // Retorna "YYYY-MM-DD"
    }

    /**
     * NOVO: Configura agendamento para um canal
     */
    setSchedule(guildId, channelId, mode, time, intervalDays = null) {
        const config = ConfigService.get(guildId);
        const cleaning = config.cleaning || {};

        if (!cleaning[channelId]) {
            cleaning[channelId] = {
                type: 'scheduled',
                filters: ['all'],
                exclusions: {},
                active: true
            };
        }

        const schedule = {
            mode, // 'daily' ou 'interval'
            time, // "22:00"
            timezone: config.timezone || 'UTC'
        };

        if (mode === 'interval') {
            schedule.intervalDays = intervalDays || 2;
            schedule.lastRun = null; // Será definido na primeira execução
        }

        cleaning[channelId].schedule = schedule;
        cleaning[channelId].active = true;

        ConfigService.update(guildId, { cleaning });

        console.log(`[CleaningService] Agendamento configurado: ${mode} às ${time}${mode === 'interval' ? ` (a cada ${intervalDays} dias)` : ''}`);
    }

    /**
     * NOVO: Desativa agendamento de um canal
     */
    disableSchedule(guildId, channelId) {
        const config = ConfigService.get(guildId);
        const cleaning = config.cleaning || {};

        if (cleaning[channelId] && cleaning[channelId].schedule) {
            delete cleaning[channelId].schedule;
            ConfigService.update(guildId, { cleaning });
            console.log(`[CleaningService] Agendamento desativado para ${channelId}`);
        }
    }

    /**
     * LEGADO: Mantido para compatibilidade (limpeza automática por intervalo sem agendamento)
     */
    schedule(client, guildId, channelId, type, value, filters = [], exclusions = {}) {
        this.stop(channelId);

        if (type === 'interval') {
            console.log(`[Cleaning] Agendamento via intervalo para ${channelId} a cada ${value}ms`);

            this.activeIntervals[channelId] = setInterval(() => {
                this.cleanChannel(client, channelId, { limit: 50, filters: filters, exclusions: exclusions, trigger: 'auto' });
            }, value);

            const config = ConfigService.get(guildId);
            const cleaning = config.cleaning || {};
            cleaning[channelId] = { type, value, filters, exclusions, active: true };
            ConfigService.update(guildId, { cleaning });
        }
    }

    stop(guildId, channelId) {
        if (this.activeIntervals[channelId]) {
            clearInterval(this.activeIntervals[channelId]);
            delete this.activeIntervals[channelId];
            console.log(`[Cleaning] Parado para ${channelId}`);
        }

        if (guildId) {
            const config = ConfigService.get(guildId);
            const cleaning = config.cleaning || {};
            if (cleaning[channelId]) {
                delete cleaning[channelId];
                ConfigService.update(guildId, { cleaning });
            }
        }
    }
}

module.exports = new CleaningService();
