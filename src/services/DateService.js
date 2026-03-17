const ConfigService = require('./ConfigService');
const LocaleService = require('./LocaleService');
const LogService = require('./LogService');
const NotificationService = require('./NotificationService');

const GLOBAL_DATES = [
    { id: 'new_year', day: 1, month: 1 },
    { id: 'valentines_br', day: 12, month: 6, lang: 'pt-BR' },
    { id: 'valentines', day: 14, month: 2, lang: 'en-US' },
    { id: 'sysadmin', day: 28, month: 7 },
    { id: 'programmer', day: 13, month: 9 },
    { id: 'halloween', day: 31, month: 10 },
    { id: 'christmas', day: 25, month: 12 }
];

class DateService {
    constructor() {
        this.client = null;
        this.checkInterval = null;
    }

    init(client) {
        this.client = client;
        this.startScheduler();
    }

    startScheduler() {
        if (this.checkInterval) clearInterval(this.checkInterval);
        this.checkInterval = setInterval(() => this.checkDaily(), 60 * 60 * 1000);
        this.checkDaily();
    }

    async isChannelAlive(channel) {
        if (!channel || !channel.isTextBased()) return false;
        try {
            const messages = await channel.messages.fetch({ limit: 1 });
            const lastMsg = messages.first();
            if (!lastMsg) return false;
            const now = Date.now();
            const daysDiff = (now - lastMsg.createdTimestamp) / (1000 * 60 * 60 * 24);
            return daysDiff < 7;
        } catch (e) {
            console.error(`[DateService] Erro ao verificar canal ${channel.id}:`, e);
            return false;
        }
    }

    async checkDaily() {
        if (!this.client) return;
        console.log('[DateService] Verificando datas...');
        const now = new Date();
        const guilds = this.client.guilds.cache.map(g => g.id);

        for (const guildId of guilds) {
            this.processGuild(guildId, now);
        }
    }

    async processGuild(guildId, now) {
        const config = ConfigService.get(guildId);
        if (!config) return;

        const datesConfig = config.dates || {};
        const lastRun = datesConfig.lastRun || '';
        const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        const hour = now.getHours();

        if (lastRun !== todayStr && hour >= 10) {
            await this.processGlobalDates(guildId, config, now);
            datesConfig.lastRun = todayStr;
            ConfigService.update(guildId, { dates: datesConfig });
        }

        await this.processCustomDates(guildId, config, now);
    }

    async processGlobalDates(guildId, config, dateObj) {
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const guildLang = config.language || 'pt-BR';
        const datesConfig = config.dates || {};
        const disabledGlobals = datesConfig.disabledGlobals || [];

        const globalChannelId = datesConfig.globalChannel;

        // Se não configurado, PULA e registra erro
        if (!globalChannelId) {
            const isDateToday = GLOBAL_DATES.some(d => d.day === day && d.month === month && !disabledGlobals.includes(d.id));

            if (isDateToday) {
                LogService.add(guildId, {
                    type: LogService.Events.SYSTEM_SKIP,
                    description: 'Datas Globais Puladas: Nenhum Canal Global Configurado.'
                });
                // Notifica admin se possível
                NotificationService.notify(this.client, guildId, 'system_skip', null, `Data Global perdida! Configure um canal no Menu de Datas.`);
            }
            return;
        }

        const targetChannel = this.client.guilds.cache.get(guildId)?.channels.cache.get(globalChannelId);

        // Segurança: Canal Inválido
        if (!targetChannel) {
            LogService.add(guildId, {
                type: LogService.Events.SYSTEM_SKIP,
                description: `Datas Globais Puladas: ID de Canal Inválido (${globalChannelId})`
            });
            NotificationService.notify(this.client, guildId, 'system_skip', null, `Canal Global é inválido/deletado.`);
            return;
        }

        if (!(await this.isChannelAlive(targetChannel))) {
            LogService.add(guildId, {
                type: LogService.Events.SYSTEM_SKIP,
                description: `Datas Globais Puladas: Canal Morto (${targetChannel.name})`
            });
            return;
        }

        for (const globalDate of GLOBAL_DATES) {
            if (globalDate.day === day && globalDate.month === month) {
                if (disabledGlobals.includes(globalDate.id)) continue;
                if (globalDate.lang && globalDate.lang !== guildLang) continue;

                const msgKey = `dates.messages.${globalDate.id}`;
                const msg = LocaleService.t(msgKey, guildLang);

                if (msg !== msgKey) {
                    await targetChannel.send(`📅 **${msg}**`).catch(() => { });
                    LogService.add(guildId, {
                        type: LogService.Events.DATE_TRIGGERED,
                        description: LocaleService.t('logs.descriptions.date_triggered', guildLang, { name: globalDate.id, channel: targetChannel.name }),
                        channelId: targetChannel.id
                    });
                }
            }
        }
    }

    async processCustomDates(guildId, config, dateObj) {
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const hour = dateObj.getHours();

        const datesConfig = config.dates || {};
        const customs = datesConfig.customs || [];

        let modified = false;

        for (const custom of customs) {
            if (custom.day !== day || custom.month !== month) continue;
            if (custom.active === false) continue;
            if (custom.lastYear === dateObj.getFullYear()) continue;

            const targetHour = custom.time ? parseInt(custom.time.split(':')[0]) : 10;
            if (hour < targetHour) continue;

            const channelId = custom.channelId;
            if (!channelId) {
                LogService.add(guildId, {
                    type: LogService.Events.SYSTEM_SKIP,
                    description: `Data Personalizada '${custom.name}' Pulada: Nenhum Canal Vinculado`
                });
                continue;
            }

            const channelToSend = this.client.guilds.cache.get(guildId)?.channels.cache.get(channelId);

            if (!channelToSend) {
                LogService.add(guildId, {
                    type: LogService.Events.SYSTEM_SKIP,
                    description: `Data Personalizada '${custom.name}' Pulada: Canal Inválido`
                });
                continue;
            }

            if (!(await this.isChannelAlive(channelToSend))) {
                LogService.add(guildId, {
                    type: LogService.Events.SYSTEM_SKIP,
                    description: `Data Personalizada '${custom.name}' Pulada: Canal Morto (${channelToSend.name})`
                });
                continue;
            }

            const guildLang = config.language || 'pt-BR';
            let msg = custom.message;
            if (!msg) {
                msg = LocaleService.t('dates.default_custom', guildLang, { name: custom.name });
            }

            await channelToSend.send(msg).catch(() => { });
            LogService.add(guildId, {
                type: LogService.Events.DATE_TRIGGERED,
                description: LocaleService.t('logs.descriptions.date_triggered', guildLang, { name: custom.name, channel: channelToSend.name }),
                channelId: channelToSend.id
            });

            custom.lastYear = dateObj.getFullYear();
            modified = true;
        }

        if (modified) {
            ConfigService.update(guildId, { dates: { ...datesConfig, customs } });
        }
    }

    addCustomDate(guildId, name, day, month, message, channelId, userId) {
        const config = ConfigService.get(guildId);
        const dates = config.dates || {};
        const customs = dates.customs || [];

        if (customs.length >= 5) throw new Error('Limite atingido');

        const newDate = {
            id: Date.now().toString(),
            name,
            day,
            month,
            message,
            channelId,
            userId,
            active: true
        };
        customs.push(newDate);

        ConfigService.update(guildId, { dates: { ...dates, customs } });
        return newDate;
    }

    removeCustomDate(guildId, dateId) {
        const config = ConfigService.get(guildId);
        const dates = config.dates || {};
        let customs = dates.customs || [];

        customs = customs.filter(d => d.id !== dateId);

        ConfigService.update(guildId, { dates: { ...dates, customs } });
    }

    // Auxiliar para definir canal global
    setGlobalChannel(guildId, channelId) {
        const config = ConfigService.get(guildId);
        const dates = config.dates || {};
        dates.globalChannel = channelId;
        ConfigService.update(guildId, { dates });
    }

    getGlobalDates() {
        return GLOBAL_DATES;
    }
}

module.exports = new DateService();
