const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ConfigService = require('../../services/ConfigService');
const DateService = require('../../services/DateService');
const PermissionService = require('../../services/PermissionService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Exibe o resumo administrativo do bot.'),
    async execute(interaction, { t, lang }) {
        const isAdmin = PermissionService.canManageBot(interaction.member);
        const config = ConfigService.get(interaction.guildId);



        const langMap = {
            'pt-BR': '🇧🇷 Português (Brasil)',
            'en-US': '🇺🇸 English (US)'
        };
        const langCode = config.language || 'pt-BR';
        const langName = langMap[langCode] || langCode;
        const langDisplay = `\`${langCode}\`\n${langName}`;


        const cleanings = config.cleaning ? Object.values(config.cleaning).filter(c => c.active).length : 0;
        const antispam = config.antispam?.enabled;
        const globalDates = DateService.getGlobalDates().length;
        const disabledGlobals = config.dates?.disabledGlobals?.length || 0;
        const customDates = config.dates?.customs?.length || 0;
        const totalDates = (globalDates - disabledGlobals) + customDates;
        const notifyChannel = config.security?.notificationChannel || t('status.value_none', lang);
        const notifyDisplay = notifyChannel === t('status.value_none', lang)
            ? notifyChannel
            : `<#${notifyChannel}>`;

        const modulesContent = [
            `**${t('status.field_cleaning', lang)}:** ${cleanings > 0 ? t('status.value_on', lang) + ` (${cleanings})` : t('status.value_off', lang)}`,
            `**${t('status.field_antispam', lang)}:** ${antispam ? t('status.value_on', lang) : t('status.value_off', lang)}`,
            `**${t('status.field_dates', lang)}:** ${totalDates}`,
            `**${t('status.field_notify', lang)}:** ${notifyDisplay}`
        ].join('\n');


        const channelCleaner = config.cleaning?.[interaction.channelId];
        let protectionContent = t('status.prot_none', lang);

        if (channelCleaner) {
            const exclusions = channelCleaner.exclusions || {};
            const ignorePinned = exclusions.ignorePinned !== false;
            const ignoreBots = exclusions.ignoreBots || false;
            const ignoreSystem = exclusions.ignoreSystem !== false;
            const minAge = exclusions.minAge !== undefined ? exclusions.minAge : 5;
            const minReactions = exclusions.minReactions || 0;
            const ignoreRoles = exclusions.ignoreRoles || [];

            const pLines = [];
            pLines.push(`**${t('status.prot_pinned', lang)}:** ${ignorePinned ? 'ON' : 'OFF'}`);
            pLines.push(`**${t('status.prot_bots', lang)}:** ${ignoreBots ? 'ON' : 'OFF'}`);

            const ageText = minAge > 0 ? `ON (< ${minAge} ${t('status.min', lang)})` : 'OFF';
            pLines.push(`**${t('status.prot_recent', lang)}:** ${ageText}`);

            pLines.push(`**${t('status.prot_reactions', lang)}:** ${minReactions > 0 ? minReactions : 'OFF'}`);

            const rolesText = ignoreRoles.length > 0 ? `${ignoreRoles.length} cargos` : t('status.roles_none', lang);
            pLines.push(`**${t('status.prot_roles', lang)}:** ${rolesText}`);

            protectionContent = pLines.join('\n');
        }


        const authorizedRoles = config.security?.authorizedRoles || [];
        let permissionContent = "";

        if (authorizedRoles.length > 0) {
            const mentions = authorizedRoles.slice(0, 5).map(id => `<@&${id}>`);
            if (authorizedRoles.length > 5) mentions.push(`+${authorizedRoles.length - 5}...`);
            permissionContent = mentions.join(', ');
        } else {
            permissionContent = t('status.perm_default', lang);
        }


        let scheduleContent = '';
        if (channelCleaner && channelCleaner.schedule && channelCleaner.schedule.mode && channelCleaner.schedule.mode !== 'off') {
            const sch = channelCleaner.schedule;
            const modeLabel = lang === 'en-US' ? 'Mode' : 'Modo';
            const timeLabel = lang === 'en-US' ? 'Time' : 'Horário';
            let modeVal = '';
            if (sch.mode === 'daily') {
                modeVal = lang === 'en-US' ? 'Daily' : 'Diário';
            } else if (sch.mode === 'interval') {
                modeVal = lang === 'en-US' ? `Every ${sch.intervalDays} days` : `A cada ${sch.intervalDays} dias`;
            }
            scheduleContent = `**${modeLabel}:** ${modeVal}\n**${timeLabel}:** ${sch.time}`;
        }

        const embedFields = [
            {
                name: t('status.section_general', lang),
                value: `**${t('status.field_lang', lang)}:** ${langDisplay}\n**${t('status.field_timezone', lang)}:** ${config.timezone || 'UTC'}`,
                inline: true
            },
            {
                name: t('status.section_modules', lang),
                value: modulesContent,
                inline: true
            },
            {
                name: t('dates.embed_title', lang),
                value: (config.dates?.customs || []).length > 0
                    ? (config.dates.customs.slice(0, 5).map(c => `${c.name} (${String(c.day).padStart(2, '0')}/${String(c.month).padStart(2, '0')})`).join('\n') + (config.dates.customs.length > 5 ? `\n+${config.dates.customs.length - 5} ...` : ''))
                    : t('dates.field_none', lang),
                inline: false
            }
        ];

        if (scheduleContent) {
            embedFields.push({
                name: t('menus.cleaning.schedule_title', lang) || "⏱️ Horário de Funcionamento",
                value: scheduleContent,
                inline: false
            });
        }

        embedFields.push(
            {
                name: t('status.section_protection', lang),
                value: protectionContent,
                inline: false
            },
            {
                name: t('status.section_permissions', lang),
                value: `**${t('status.perm_roles', lang)}:**\n${permissionContent}`,
                inline: false
            }
        );


        const embed = new EmbedBuilder()
            .setTitle(t('status.title', lang))
            .setDescription(t('status.description', lang))
            .setColor('#0099ff')
            .addFields(embedFields)
            .setFooter({ text: t('status.footer', lang, { time: new Date().toLocaleTimeString(lang, { timeZone: config.timezone || 'UTC' }) }) });

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(t('status.btn_site', lang))
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://spriters-bot-discord.onrender.com'),
                new ButtonBuilder()
                    .setLabel(t('status.btn_docs', lang))
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://spriters-bot-discord.onrender.com/ajuda')
            );

        if (isAdmin) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_main_menu')
                    .setLabel(t('status.btn_config', lang))
                    .setStyle(ButtonStyle.Primary)
            );
        }

        await interaction.editReply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
