const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelSelectMenuBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const ConfigService = require('../services/ConfigService');

const PermissionService = require('../services/PermissionService');
const CleaningService = require('../services/CleaningService');
const LogService = require('../services/LogService');
const AntiSpamService = require('../services/AntiSpamService');
const DateService = require('../services/DateService');
const NotificationService = require('../services/NotificationService');
const LocaleService = require('../services/LocaleService');

const CentralInteractionHandler = {
    async handle(interaction, context) {
        const { client, config, lang, t } = context;
        const { customId, values, member } = interaction;

        // Verificação de permissão para ações sensíveis
        const sensitiveIDs = [
            'menu_main_select',
            'menu_cleaning_filters',
            'menu_cleaning_interval',
            'btn_cleaning_manual',
            'btn_cleaning_manual_confirm',
            'btn_cleaning_toggle_auto',
            'menu_security_role',
            'menu_security_channel',
            'btn_antispam_toggle',
            'menu_antispam_config',
            'btn_logs_clear',
            'btn_logs_confirm_clear',
            'btn_logs_refresh',
            'btn_dates_new',
            'btn_dates_refresh',
            'menu_date_channel_select'
        ];

        if (sensitiveIDs.includes(customId) || customId.startsWith('menu_') || customId.startsWith('btn_dates_delete_')) {
            if (!PermissionService.canManageBot(member)) {
                return interaction.reply({ content: t('errors.unauthorized', lang), ephemeral: true });
            }
        }

        try {
            // Botão de atalho do /status para configurar
            if (customId === 'btn_main_menu') {
                if (!PermissionService.canManageBot(member)) {
                    return interaction.reply({ content: t('errors.unauthorized', lang), ephemeral: true });
                }
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
                        { label: t('menus.main.options.cleaning_label', lang), description: t('menus.main.options.cleaning_desc', lang), value: 'cleaning', emoji: '🧹' },
                        { label: t('menus.main.options.antispam_label', lang), description: t('menus.main.options.antispam_desc', lang), value: 'antispam', emoji: '🛡️' },
                        { label: t('menus.main.options.logs_label', lang), description: t('menus.main.options.logs_desc', lang), value: 'logs', emoji: '📝' },
                        { label: t('menus.main.options.permissions_label', lang), description: t('menus.main.options.permissions_desc', lang), value: 'security', emoji: '👮' },
                        { label: t('menus.main.options.dates_label', lang), description: t('menus.main.options.dates_desc', lang), value: 'dates', emoji: '📅' },
                        { label: 'Idioma / Language', description: 'Change language', value: 'language', emoji: '🗣️' },
                    ]);

                const row = new ActionRowBuilder().addComponents(select);

                await interaction.update({
                    content: t('commands.setup.welcome_msg', lang),
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
            }

            // Navegação do Menu Principal
            if (customId === 'menu_main_select') {
                const selected = values[0];
                switch (selected) {
                    case 'cleaning':
                        await this.showCleaningMenu(interaction, context);
                        break;
                    case 'antispam':
                        await this.showAntiSpamMenu(interaction, context);
                        break;
                    case 'logs':
                        await this.showLogsMenu(interaction, context);
                        break;
                    case 'security':
                        await this.showSecurityMenu(interaction, context);
                        break;
                    case 'language':
                        await this.showLanguageMenu(interaction, context);
                        break;
                    case 'dates':
                        await this.showDatesMenu(interaction, context);
                        break;
                    default:
                        await interaction.reply({ content: 'Funcionalidade em desenvolvimento.', ephemeral: true });
                }
            }

            // Botão de Onboarding
            if (customId === 'onboarding_configure') {
                await interaction.reply({
                    content: t('commands.setup.welcome_msg', lang),
                    components: [],
                    ephemeral: true
                });
            }

            // Idioma alterado
            if (customId === 'menu_language_select') {
                const newLang = values[0];
                ConfigService.update(interaction.guildId, { language: newLang });

                // Pega insulto no novo idioma para preview (mantendo característica do bot)
                const previewInsult = LocaleService.t('insults', newLang);

                // Notifica Admin
                NotificationService.notify(client, interaction.guildId, 'config_change', interaction.user, `Idioma alterado para: ${newLang}`);
                LogService.add(interaction.guildId, {
                    type: LogService.Events.LANGUAGE_CHANGED,
                    user: interaction.user,
                    description: t('logs.descriptions.language_changed', lang, { lang: newLang }),
                    metadata: { lang: newLang }
                });

                await interaction.update({
                    content: `✅ **${t('commands.language.changed', newLang, { lang: newLang })}**\n\nPreview: _"${previewInsult}"_`,
                    components: []
                });
            }

            // Handlers do Menu de Limpeza
            if (customId === 'menu_cleaning_filters') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};

                const newFilters = values;

                // Atualizar Configuração
                const updates = {
                    filters: newFilters,
                    type: currentCleaner.type || 'interval',
                    value: currentCleaner.value || 3600000, // Padrão 1h
                    active: currentCleaner.active || false
                };

                // Se auto estiver ativo, reagenda
                if (updates.active) {
                    CleaningService.schedule(client, interaction.guildId, interaction.channelId, updates.type, updates.value, updates.filters);
                } else {
                    // Apenas salva a config
                    const cleaning = config.cleaning || {};
                    cleaning[interaction.channelId] = updates;
                    const updatedConfig = ConfigService.update(interaction.guildId, { cleaning });

                    LogService.add(interaction.guildId, {
                        type: LogService.Events.CLEAN_RULE_UPDATED,
                        user: interaction.user,
                        channelId: interaction.channelId,
                        description: t('logs.descriptions.clean_rule_updated', lang, { channel: interaction.channel.name }),
                        metadata: { filters: newFilters }
                    });
                    NotificationService.notify(client, interaction.guildId, 'config_change', interaction.user, `Filtros de Limpeza Atualizados: ${newFilters.join(', ')}`);

                    await this.showCleaningMenu(interaction, { ...context, config: updatedConfig }, true);
                }
            }

            if (customId === 'menu_cleaning_interval') {
                const value = parseInt(values[0]);
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};

                const updates = {
                    filters: currentCleaner.filters || ['all'],
                    type: 'interval',
                    value: value,
                    active: currentCleaner.active || false
                };

                if (updates.active) {
                    CleaningService.schedule(client, interaction.guildId, interaction.channelId, updates.type, updates.value, updates.filters);
                } else {
                    const cleaning = config.cleaning || {};
                    cleaning[interaction.channelId] = updates;
                    ConfigService.update(interaction.guildId, { cleaning });

                    LogService.add(interaction.guildId, {
                        type: LogService.Events.CLEAN_RULE_UPDATED,
                        user: interaction.user,
                        channelId: interaction.channelId,
                        description: t('logs.descriptions.clean_rule_updated', lang, { channel: interaction.channel.name }),
                        metadata: { interval: value }
                    });
                }

                const updatedConfig = ConfigService.get(interaction.guildId); // Recarrega config
                await this.showCleaningMenu(interaction, { ...context, config: updatedConfig }, true);
            }

            if (customId === 'btn_cleaning_toggle_auto') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};
                const newState = !currentCleaner.active;

                if (newState) {
                    // Ligar -> Requer Confirmação
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('btn_cleaning_auto_confirm_on')
                            .setLabel('CONFIRMAR ATIVAÇÃO')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('btn_back_cleaning')
                            .setLabel('CANCELAR')
                            .setStyle(ButtonStyle.Secondary)
                    );

                    await interaction.update({
                        content: `⚠️ **ATENÇÃO:** Você está prestes a ativar a limpeza automática neste canal.\nEu vou apagar tudo que corresponder aos filtros a cada ${(currentCleaner.value || 3600000) / 60000} minutos.\n\nTem certeza que quer me dar esse poder?`,
                        embeds: [],
                        components: [row]
                    });
                } else {
                    // Desligar -> Imediato
                    CleaningService.stop(interaction.guildId, interaction.channelId);
                    const cleaning = config.cleaning || {};
                    cleaning[interaction.channelId] = { ...currentCleaner, active: false };
                    ConfigService.update(interaction.guildId, { cleaning });

                    LogService.add(interaction.guildId, {
                        type: LogService.Events.WINDOW_UPDATED,
                        user: interaction.user,
                        channelId: interaction.channelId,
                        description: t('logs.descriptions.window_updated', lang, { channel: interaction.channel.name }),
                        metadata: { active: false }
                    });

                    const updatedConfig = ConfigService.get(interaction.guildId);
                    await this.showCleaningMenu(interaction, { ...context, config: updatedConfig }, true);
                }
            }

            if (customId === 'btn_cleaning_auto_confirm_on') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};

                const updates = {
                    filters: currentCleaner.filters || ['all'],
                    exclusions: currentCleaner.exclusions || {},
                    type: currentCleaner.type || 'interval',
                    value: currentCleaner.value || 3600000,
                    active: true
                };

                CleaningService.schedule(client, interaction.guildId, interaction.channelId, updates.type, updates.value, updates.filters, updates.exclusions);

                LogService.add(interaction.guildId, {
                    type: LogService.Events.WINDOW_UPDATED,
                    user: interaction.user,
                    channelId: interaction.channelId,
                    description: t('logs.descriptions.window_updated', lang, { channel: interaction.channel.name }),
                    metadata: { active: true }
                });

                const updatedConfig = ConfigService.get(interaction.guildId);
                await this.showCleaningMenu(interaction, { ...context, config: updatedConfig }, true);
            }

            if (customId === 'btn_cleaning_manual') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};
                const filters = currentCleaner.filters || ['all'];
                const filterNames = filters.map(f => t(`menus.cleaning.types.${f}`, lang)).join(', ');

                const confirmEmbed = new EmbedBuilder()
                    .setTitle(t('menus.cleaning.confirm.manual_title', lang))
                    .setDescription(t('menus.cleaning.confirm.manual_desc', lang, { filters: filterNames }))
                    .setColor('#FF0000');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('btn_cleaning_manual_confirm')
                        .setLabel(t('menus.cleaning.confirm.btn_yes', lang))
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('btn_back_cleaning') // Apenas re-renderiza o menu de limpeza
                        .setLabel(t('menus.cleaning.confirm.btn_no', lang))
                        .setStyle(ButtonStyle.Secondary)
                );

                await interaction.update({ embeds: [confirmEmbed], components: [row] });
            }

            if (customId === 'btn_back_cleaning') {
                await this.showCleaningMenu(interaction, context, true);
            }

            if (customId === 'btn_cleaning_manual_confirm') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};
                const filters = currentCleaner.filters || ['all'];
                const exclusions = currentCleaner.exclusions || {};

                await interaction.update({ content: t('commands.clean.start', lang), embeds: [], components: [] });
                const count = await CleaningService.cleanChannel(client, interaction.channelId, { limit: 100, filters, exclusions, user: interaction.user });
                await interaction.followUp({ content: t('commands.clean.done', lang, { count }), ephemeral: true });
            }

            // HANDLERS DE AGENDAMENTO (NOVO SISTEMA)
            if (customId === 'btn_cleaning_schedule') {
                await this.showCleaningScheduleMenu(interaction, context, true);
            }

            if (customId === 'menu_schedule_mode') {
                const mode = values[0]; // 'off', 'daily', 'interval_2', 'interval_3', 'interval_6'

                if (mode === 'off') {
                    CleaningService.disableSchedule(interaction.guildId, interaction.channelId);

                    LogService.add(interaction.guildId, {
                        type: LogService.Events.SCHEDULE_UPDATED,
                        user: interaction.user,
                        channelId: interaction.channelId,
                        description: t('logs.descriptions.schedule_updated', lang, { channel: interaction.channel.name }),
                        metadata: { mode: 'off' }
                    });

                    await this.showCleaningScheduleMenu(interaction, context, true);
                } else {
                    // Para todos os modos ativos, precisamos de um horário
                    // Vamos abrir o modal para definir horário
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_schedule_time_${mode}`)
                        .setTitle('Definir Horário da Limpeza');

                    const timeInput = new TextInputBuilder()
                        .setCustomId('schedule_time')
                        .setLabel('Horário (HH:mm)')
                        .setPlaceholder('Ex: 22:00')
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(5)
                        .setMinLength(5)
                        .setRequired(true);

                    const row = new ActionRowBuilder().addComponents(timeInput);
                    modal.addComponents(row);

                    await interaction.showModal(modal);
                }
            }

            if (customId.startsWith('modal_schedule_time_')) {
                const mode = customId.replace('modal_schedule_time_', ''); // 'daily' ou 'interval_X'
                const time = interaction.fields.getTextInputValue('schedule_time');

                // Validação
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(time)) {
                    await interaction.reply({ content: t('errors.invalid_args', lang), ephemeral: true });
                    return;
                }

                // Configura agendamento
                if (mode === 'daily') {
                    CleaningService.setSchedule(interaction.guildId, interaction.channelId, 'daily', time);
                } else if (mode.startsWith('interval_')) {
                    const days = parseInt(mode.split('_')[1]); // 'interval_2' -> 2
                    CleaningService.setSchedule(interaction.guildId, interaction.channelId, 'interval', time, days);
                }

                LogService.add(interaction.guildId, {
                    type: LogService.Events.SCHEDULE_UPDATED,
                    user: interaction.user,
                    channelId: interaction.channelId,
                    description: t('logs.descriptions.schedule_updated', lang, { channel: interaction.channel.name }),
                    metadata: { mode, time }
                });

                // Não usamos deferUpdate aqui pois showCleaningScheduleMenu já lidará com a resposta/update
                await this.showCleaningScheduleMenu(interaction, context, true);
            }

            if (customId === 'btn_schedule_test') {
                await interaction.deferReply({ ephemeral: true });

                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};

                const count = await CleaningService.cleanChannel(
                    interaction.client,
                    interaction.channelId,
                    {
                        limit: 100,
                        filters: currentCleaner.filters || ['all'],
                        exclusions: currentCleaner.exclusions || {},
                        trigger: 'manual'
                    }
                );

                await interaction.editReply({ content: `✅ Teste executado! ${count} mensagens removidas.` });
            }

            // HANDLERS LEGADOS (Removidos - substituídos pelo novo sistema)
            // btn_cleaning_schedule_off, btn_cleaning_schedule_set, modal_cleaning_schedule

            // HANDLERS DO MENU DE SEGURANÇA
            if (customId === 'btn_cleaning_safety') {
                await this.showCleaningSafetyMenu(interaction, context, true);
            }

            if (customId === 'menu_cleaning_safety_toggles') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};
                const exclusions = currentCleaner.exclusions || {};

                exclusions.ignorePinned = values.includes('ignore_pinned');
                exclusions.ignoreBots = values.includes('ignore_bots');
                exclusions.ignoreSystem = values.includes('ignore_system');

                const cleaning = config.cleaning || {};
                cleaning[interaction.channelId] = { ...currentCleaner, exclusions };
                const updatedConfig = ConfigService.update(interaction.guildId, { cleaning });
                LogService.add(interaction.guildId, {
                    type: LogService.Events.CLEAN_RULE_UPDATED,
                    user: interaction.user,
                    channelId: interaction.channelId,
                    description: t('logs.descriptions.clean_rule_updated', lang, { channel: interaction.channel.name }),
                    metadata: { exclusions }
                });

                await this.showCleaningSafetyMenu(interaction, { ...context, config: updatedConfig }, true);
            }

            if (customId === 'menu_cleaning_safety_age') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};
                const exclusions = currentCleaner.exclusions || {};

                exclusions.minAge = parseInt(values[0]);

                const cleaning = config.cleaning || {};
                cleaning[interaction.channelId] = { ...currentCleaner, exclusions };
                const updatedConfig = ConfigService.update(interaction.guildId, { cleaning });
                LogService.add(interaction.guildId, {
                    type: LogService.Events.CLEAN_RULE_UPDATED,
                    user: interaction.user,
                    channelId: interaction.channelId,
                    description: t('logs.descriptions.clean_rule_updated', lang, { channel: interaction.channel.name }),
                    metadata: { minAge: exclusions.minAge }
                });

                await this.showCleaningSafetyMenu(interaction, { ...context, config: updatedConfig }, true);
            }

            if (customId === 'menu_cleaning_safety_reactions') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};
                const exclusions = currentCleaner.exclusions || {};

                exclusions.minReactions = parseInt(values[0]);

                const cleaning = config.cleaning || {};
                cleaning[interaction.channelId] = { ...currentCleaner, exclusions };
                const updatedConfig = ConfigService.update(interaction.guildId, { cleaning });
                LogService.add(interaction.guildId, {
                    type: LogService.Events.CLEAN_RULE_UPDATED,
                    user: interaction.user,
                    channelId: interaction.channelId,
                    description: t('logs.descriptions.clean_rule_updated', lang, { channel: interaction.channel.name }),
                    metadata: { minReactions: exclusions.minReactions }
                });

                await this.showCleaningSafetyMenu(interaction, { ...context, config: updatedConfig }, true);
            }

            if (customId === 'menu_cleaning_safety_roles') {
                const config = ConfigService.get(interaction.guildId);
                const currentCleaner = config.cleaning?.[interaction.channelId] || {};
                const exclusions = currentCleaner.exclusions || {};

                exclusions.ignoreRoles = values;

                const cleaning = config.cleaning || {};
                cleaning[interaction.channelId] = { ...currentCleaner, exclusions };
                const updatedConfig = ConfigService.update(interaction.guildId, { cleaning });
                await this.showCleaningSafetyMenu(interaction, { ...context, config: updatedConfig }, true);
            }

            // Menu de Segurança - Seleção de Cargo
            if (customId === 'menu_security_role') {
                PermissionService.setAuthorizedRoles(interaction.guildId, values);

                LogService.add(interaction.guildId, {
                    type: LogService.Events.PERMISSION_UPDATED,
                    user: interaction.user,
                    description: t('logs.descriptions.permission_updated', lang),
                    metadata: { roles: values }
                });

                const embed = new EmbedBuilder()
                    .setTitle(t('success.config_saved', lang))
                    .setDescription(t('success.saved', lang))
                    .setColor('#00FF00');
                await interaction.update({ embeds: [embed], components: [], content: null });
            }

            if (customId === 'menu_security_channel') {
                const channelId = values[0];
                const config = ConfigService.get(interaction.guildId);
                const security = config.security || {};
                security.notificationChannel = channelId;

                ConfigService.update(interaction.guildId, { security });

                LogService.add(interaction.guildId, {
                    type: LogService.Events.CHANNEL_UPDATED,
                    user: interaction.user,
                    description: t('logs.descriptions.channel_updated', lang, { type: 'Notificação', channel: interaction.guild.channels.cache.get(channelId)?.name || channelId }),
                    metadata: { channelId }
                });

                const embed = new EmbedBuilder()
                    .setTitle(t('success.config_saved', lang))
                    .setDescription(t('success.saved', lang))
                    .setColor('#00FF00');
                await interaction.update({ embeds: [embed], components: [], content: null });
            }

            if (customId === 'menu_timezone_select') {
                const newTz = values[0];
                ConfigService.update(interaction.guildId, { timezone: newTz });

                LogService.add(interaction.guildId, {
                    type: LogService.Events.TIMEZONE_CHANGED,
                    user: interaction.user,
                    description: t('logs.descriptions.timezone_changed', lang, { tz: newTz }),
                    metadata: { timezone: newTz }
                });

                const embed = new EmbedBuilder()
                    .setTitle(t('success.config_saved', lang))
                    .setDescription(t('success.saved', lang))
                    .setColor('#00FF00');
                await interaction.update({ embeds: [embed], components: [], content: null });
            }
            // Botão Voltar
            if (customId === 'btn_back_main') {
                // Ack
                // Tratamento seguro se já respondeu
                try {
                    await interaction.update({ content: t('errors.anxiety', lang), components: [] });
                } catch (e) {/* ignore */ }
            }

            /**
             * HANDLERS DE LOGS
             */
            if (customId === 'btn_logs_refresh') {
                await this.showLogsMenu(interaction, context, true);
            }

            if (customId === 'btn_logs_clear') {
                const embed = new EmbedBuilder()
                    .setTitle(t('menus.logs.confirm_clear_title', lang))
                    .setDescription(t('menus.logs.confirm_clear_desc', lang))
                    .setColor('#FF0000');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('btn_logs_confirm_clear')
                        .setLabel(t('menus.logs.btn_confirm', lang))
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('btn_logs_refresh')
                        .setLabel(t('menus.logs.btn_cancel', lang))
                        .setStyle(ButtonStyle.Secondary)
                );

                await interaction.update({ embeds: [embed], components: [row] });
            }

            if (customId === 'btn_logs_confirm_clear') {
                LogService.clear(interaction.guildId);
                const embed = new EmbedBuilder()
                    .setTitle(t('success.history_cleared', lang))
                    .setDescription(t('success.cleaned', lang))
                    .setColor('#00FF00');
                await interaction.update({ embeds: [embed], components: [], content: null });
            }

            /**
             * HANDLERS DE ANTISPAM
             */
            if (customId === 'btn_antispam_toggle') {
                const config = ConfigService.get(interaction.guildId);
                const spamConfig = config.antispam || { enabled: false, actions: ['delete'], blockFlood: true, blockRepeated: true };

                spamConfig.enabled = !spamConfig.enabled;
                ConfigService.update(interaction.guildId, { antispam: spamConfig });

                LogService.add(interaction.guildId, {
                    type: LogService.Events.ANTISPAM_UPDATED,
                    user: interaction.user,
                    description: t('logs.descriptions.antispam_updated', lang),
                    metadata: { enabled: spamConfig.enabled }
                });

                await this.showAntiSpamMenu(interaction, context, true);
            }

            if (customId === 'menu_antispam_config') {
                const config = ConfigService.get(interaction.guildId);
                const spamConfig = config.antispam || { enabled: false, actions: ['delete'], blockFlood: true, blockRepeated: true };

                // Reset basic flags based on selection (values contain selected items)
                spamConfig.blockFlood = values.includes('detect_flood');
                spamConfig.blockRepeated = values.includes('detect_repeated');
                spamConfig.blockLinks = values.includes('detect_links');

                // Actions
                spamConfig.actions = [];
                if (values.includes('delete')) spamConfig.actions.push('delete');
                if (values.includes('mute')) spamConfig.actions.push('mute');

                ConfigService.update(interaction.guildId, { antispam: spamConfig });

                LogService.add(interaction.guildId, {
                    type: LogService.Events.ANTISPAM_UPDATED,
                    user: interaction.user,
                    description: t('logs.descriptions.antispam_updated', lang),
                    metadata: spamConfig
                });

                await this.showAntiSpamMenu(interaction, context, true);
            }

            /**
             * HANDLERS DE DATAS
             */
            if (customId === 'btn_dates_refresh') {
                await this.showDatesMenu(interaction, context, true);
            }

            if (customId === 'btn_dates_new') {
                // Passo 1: Selecionar o canal para o novo evento
                const row = new ActionRowBuilder().addComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId('menu_date_channel_select')
                        .setPlaceholder(t('dates.new.select_channel_placeholder', lang))
                        .setChannelTypes([ChannelType.GuildText, ChannelType.GuildAnnouncement])
                        .setMaxValues(1)
                );

                await interaction.reply({
                    content: t('dates.new.step1', lang),
                    components: [row],
                    ephemeral: true
                });
            }

            if (customId === 'menu_date_channel_select') {
                // Passo 2: Mostrar Modal com ID do canal embutido no customId ou guardado temporariamente?
                // Como Modal não passa contexto extra facilmente, vou embutir o channelId no ID do modal se possível, ou usar cache temporário.
                // Mas IDs de modal tem limite de caracteres.
                // Vou embutir: modal_date_create_<channelId>
                const channelId = values[0];
                const modal = new ModalBuilder()
                    .setCustomId(`modal_date_create_${channelId}`)
                    .setTitle(t('dates.modal.title', lang));

                const nameInput = new TextInputBuilder()
                    .setCustomId('date_name')
                    .setLabel(t('dates.modal.name_label', lang))
                    .setPlaceholder(t('dates.modal.name_placeholder', lang))
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(30)
                    .setRequired(true);

                const dateInput = new TextInputBuilder()
                    .setCustomId('date_value')
                    .setLabel(t('dates.modal.date_label', lang))
                    .setPlaceholder(t('dates.modal.date_placeholder', lang))
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(5)
                    .setMinLength(3)
                    .setRequired(true);

                const msgInput = new TextInputBuilder()
                    .setCustomId('date_message')
                    .setLabel(t('dates.modal.msg_label', lang))
                    .setPlaceholder(t('dates.modal.msg_placeholder', lang))
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(200)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(dateInput),
                    new ActionRowBuilder().addComponents(msgInput)
                );

                await interaction.showModal(modal);
            }

            if (customId.startsWith('modal_date_create_')) {
                const channelId = customId.replace('modal_date_create_', '');
                const name = interaction.fields.getTextInputValue('date_name');
                const dateVal = interaction.fields.getTextInputValue('date_value');
                const message = interaction.fields.getTextInputValue('date_message') || t('dates.default_custom', lang, { name });
                const userId = interaction.user.id;

                // Validar data
                const [dayStr, monthStr] = dateVal.split('/');
                const day = parseInt(dayStr);
                const month = parseInt(monthStr);

                if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) {
                    await interaction.reply({ content: t('dates.modal.error_format', lang), ephemeral: true });
                    return;
                }

                try {
                    DateService.addCustomDate(interaction.guildId, name, day, month, message, channelId, userId);
                    LogService.add(interaction.guildId, {
                        type: LogService.Events.DATE_CREATED,
                        user: interaction.user,
                        description: t('logs.descriptions.date_created', lang, { name }),
                        metadata: { name, date: `${day}/${month}` }
                    });
                    await interaction.reply({ content: t('dates.modal.success', lang, { name, day, month }), ephemeral: true });
                    // Tentar atualizar menu anterior se possível, mas como é modal, reply fecha. 
                    // O usuário terá que recarregar o menu.
                } catch (e) {
                    await interaction.reply({ content: '❌ Erro ao salvar: ' + e.message, ephemeral: true });
                }
            }

            if (customId.startsWith('btn_dates_delete_select')) {
                const selected = values[0];
                if (selected.startsWith('btn_dates_delete_')) {
                    const dateId = selected.replace('btn_dates_delete_', '');

                    const config = ConfigService.get(interaction.guildId);
                    const customs = config.dates?.customs || [];
                    const dObj = customs.find(d => d.id === dateId);
                    const dName = dObj ? dObj.name : 'Unknown';

                    DateService.removeCustomDate(interaction.guildId, dateId);

                    LogService.add(interaction.guildId, {
                        type: LogService.Events.DATE_REMOVED,
                        user: interaction.user,
                        description: t('logs.descriptions.date_removed', lang, { name: dName }),
                        metadata: { name: dName }
                    });

                    // Refresh menu
                    await this.showDatesMenu(interaction, context, true);
                }
            }


        } catch (error) {
            console.error('Interaction Handler Error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erro Crítico: ' + error.message, ephemeral: true }).catch(() => { });
            } else {
                await interaction.followUp({ content: '❌ Erro Crítico: ' + error.message, ephemeral: true }).catch(() => { });
            }
        }
    },

    async showLanguageMenu(interaction, { t, lang }) {
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_language_select')
                .setPlaceholder(t('commands.language.select', lang))
                .addOptions([
                    { label: '🇧🇷 Português', value: 'pt-BR', description: 'Mudar para Português Brasileiro' },
                    { label: '🇺🇸 English', value: 'en-US', description: 'Switch to English' }
                ])
        );

        await interaction.reply({ content: '🗣️', components: [row], ephemeral: true });
    },

    async showCleaningMenu(interaction, { t, lang, config }, isUpdate = false) {
        if (!config) config = ConfigService.get(interaction.guildId);

        const currentCleaner = config.cleaning?.[interaction.channelId] || {};
        const activeFilters = currentCleaner.filters || ['all'];
        const activeInterval = currentCleaner.value || 3600000;
        const isActive = currentCleaner.active || false;

        const statusText = isActive ? t('menus.cleaning.status_active', lang) : t('menus.cleaning.status_inactive', lang);

        const validKeys = ['all', 'bot', 'link', 'embed', 'file'];
        const safeFilters = activeFilters.filter(f => validKeys.includes(f));
        if (safeFilters.length === 0) safeFilters.push('all');

        const filterNames = safeFilters.map(f => t(`menus.cleaning.types.${f}`, lang)).join(', ');

        const map = { '60000': '1m', '300000': '5m', '1800000': '30m', '3600000': '1h', '21600000': '6h', '43200000': '12h', '86400000': '24h' };
        let intervalKey = map[String(activeInterval)] || '1h';
        let intervalName = t(`menus.cleaning.intervals.${intervalKey}`, lang);

        const embed = new EmbedBuilder()
            .setTitle(t('menus.cleaning.title', lang))
            .setDescription(t('menus.cleaning.description', lang))
            .addFields(
                {
                    name: t('menus.cleaning.summary_title', lang),
                    value: t('menus.cleaning.summary_desc', lang, {
                        filters: filterNames,
                        interval: intervalName || intervalKey,
                        status: statusText
                    })
                },
                {
                    name: t('menus.cleaning.safety_title', lang),
                    value: t('menus.cleaning.safety_desc', lang)
                }
            )
            .setColor(isActive ? '#00FF00' : '#9933ff');

        const rowFilters = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_cleaning_filters')
                .setPlaceholder(t('menus.cleaning.placeholder_types', lang))
                .setMinValues(1)
                .setMaxValues(4)
                .addOptions([
                    { label: t('menus.cleaning.types.all', lang), value: 'all', emoji: '💥', description: 'Deleta TUDO (menos fixados)', default: safeFilters.includes('all') },
                    { label: t('menus.cleaning.types.bot', lang), value: 'bot', emoji: '🤖', description: 'Deleta mensagens de Bots', default: safeFilters.includes('bot') },
                    { label: t('menus.cleaning.types.link', lang), value: 'link', emoji: '🔗', description: 'Deleta links http/https', default: safeFilters.includes('link') },
                    { label: t('menus.cleaning.types.embed', lang), value: 'embed', emoji: '🖼️', description: 'Deleta cards/indicações visuais', default: safeFilters.includes('embed') },
                    { label: t('menus.cleaning.types.file', lang), value: 'file', emoji: '📂', description: 'Deleta imagens, vídeos e arquivos', default: safeFilters.includes('file') }
                ])
        );

        const rowInterval = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_cleaning_interval')
                .setPlaceholder(t('menus.cleaning.interval_placeholder', lang))
                .addOptions([
                    { label: t('menus.cleaning.intervals.1m', lang), value: '60000', description: 'Executa a cada 1 minuto', default: activeInterval === 60000 },
                    { label: t('menus.cleaning.intervals.5m', lang), value: '300000', description: 'Executa a cada 5 minutos', default: activeInterval === 300000 },
                    { label: t('menus.cleaning.intervals.30m', lang), value: '1800000', description: 'Executa a cada 30 minutos', default: activeInterval === 1800000 },
                    { label: t('menus.cleaning.intervals.1h', lang), value: '3600000', description: 'Executa a cada 1 hora', default: activeInterval === 3600000 },
                    { label: t('menus.cleaning.intervals.6h', lang), value: '21600000', description: 'Executa a cada 6 horas', default: activeInterval === 21600000 },
                    { label: t('menus.cleaning.intervals.12h', lang), value: '43200000', description: 'Executa a cada 12 horas', default: activeInterval === 43200000 },
                    { label: t('menus.cleaning.intervals.24h', lang), value: '86400000', description: 'Executa a cada 1 dia', default: activeInterval === 86400000 },
                ])
        );

        const rowActions = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_cleaning_manual')
                .setLabel(t('menus.cleaning.btn_manual', lang))
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('btn_cleaning_toggle_auto')
                .setLabel(t('menus.cleaning.btn_auto_toggle', lang, { status: isActive ? 'ON' : 'OFF' }))
                .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('btn_cleaning_schedule')
                .setLabel(t('menus.cleaning.schedule_btn', lang))
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('btn_cleaning_safety')
                .setLabel(t('menus.cleaning.btn_safety', lang) || "🛡️ Filtros de Segurança")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('btn_back_main')
                .setLabel('🔙')
                .setStyle(ButtonStyle.Secondary)
        );

        const payload = { embeds: [embed], components: [rowFilters, rowInterval, rowActions], ephemeral: true };

        if (isUpdate) await interaction.update(payload);
        else await interaction.reply(payload);
    },

    async showCleaningScheduleMenu(interaction, { t, lang, config }, isUpdate = false) {
        if (!config) config = ConfigService.get(interaction.guildId);

        const currentCleaner = config.cleaning?.[interaction.channelId] || {};
        const schedule = currentCleaner.schedule || null;
        const timezone = config.timezone || 'UTC';

        let statusText = 'Agendamento DESATIVADO';
        let statusColor = '#FF0000';
        let nextRun = 'N/A';

        if (schedule && schedule.mode) {
            statusColor = '#00FF00';

            if (schedule.mode === 'daily') {
                statusText = `✅ Modo: **DIÁRIO**\nHorário: **${schedule.time}**`;
                nextRun = `Hoje às ${schedule.time}`;
            } else if (schedule.mode === 'interval') {
                statusText = `✅ Modo: **A CADA ${schedule.intervalDays} DIAS**\nHorário: **${schedule.time}**`;

                if (schedule.lastRun) {
                    const daysSince = CleaningService.calculateDaysSince(schedule.lastRun, CleaningService.getCurrentDate(timezone));
                    const daysRemaining = schedule.intervalDays - daysSince;
                    nextRun = daysRemaining <= 0 ? `Hoje às ${schedule.time}` : `Em ${daysRemaining} dias às ${schedule.time}`;
                } else {
                    nextRun = `Próxima execução: Hoje às ${schedule.time}`;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('⏰ Agendamento de Limpeza')
            .setDescription(`Defina quando o bot deve executar a limpeza automática deste canal.\n\n${statusText}\n\n**Próxima Execução:** ${nextRun}\n**Fuso Horário:** ${timezone}`)
            .setColor(statusColor);

        // Seletor de Modo
        const rowMode = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_schedule_mode')
                .setPlaceholder('Selecione o modo de agendamento...')
                .addOptions([
                    {
                        label: '❌ Desativar Agendamento',
                        value: 'off',
                        description: 'Sem limpeza agendada',
                        default: !schedule || !schedule.mode
                    },
                    {
                        label: '📅 Diário (Todo dia)',
                        value: 'daily',
                        description: 'Executa todo dia no horário definido',
                        emoji: '🔁',
                        default: schedule?.mode === 'daily'
                    },
                    {
                        label: '📆 A cada 2 dias',
                        value: 'interval_2',
                        description: 'Executa a cada 2 dias',
                        emoji: '2️⃣',
                        default: schedule?.mode === 'interval' && schedule?.intervalDays === 2
                    },
                    {
                        label: '📆 A cada 3 dias',
                        value: 'interval_3',
                        description: 'Executa a cada 3 dias',
                        emoji: '3️⃣',
                        default: schedule?.mode === 'interval' && schedule?.intervalDays === 3
                    },
                    {
                        label: '📆 A cada 6 dias',
                        value: 'interval_6',
                        description: 'Executa a cada 6 dias',
                        emoji: '6️⃣',
                        default: schedule?.mode === 'interval' && schedule?.intervalDays === 6
                    }
                ])
        );

        // Botões de Ação
        const rowActions = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_schedule_test')
                .setLabel('🧪 Testar Agora')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!schedule || !schedule.mode),
            new ButtonBuilder()
                .setCustomId('btn_back_cleaning')
                .setLabel('🔙 Voltar')
                .setStyle(ButtonStyle.Secondary)
        );

        const payload = { embeds: [embed], components: [rowMode, rowActions], ephemeral: true };

        if (isUpdate) {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload);
            } else {
                await interaction.update(payload);
            }
        } else {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(payload);
            } else {
                await interaction.reply(payload);
            }
        }
    },

    async showCleaningSafetyMenu(interaction, { t, lang, config }, isUpdate = false) {
        if (!config) config = ConfigService.get(interaction.guildId);
        const currentCleaner = config.cleaning?.[interaction.channelId] || {};
        const exclusions = currentCleaner.exclusions || {};

        const embed = new EmbedBuilder()
            .setTitle(t('menus.safety.title', lang))
            .setDescription(t('menus.safety.description', lang))
            .setColor('#FFA500');

        const defaultToggles = [];
        if (exclusions.ignorePinned !== false) defaultToggles.push('ignore_pinned');
        if (exclusions.ignoreBots) defaultToggles.push('ignore_bots');
        if (exclusions.ignoreSystem !== false) defaultToggles.push('ignore_system');

        const rowToggles = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_cleaning_safety_toggles')
                .setPlaceholder('🛡️ Tipos Protegidos...')
                .setMinValues(0)
                .setMaxValues(3)
                .addOptions([
                    { label: t('menus.safety.toggles.pinned', lang), value: 'ignore_pinned', description: 'Nunca apagar mensagens fixadas', emoji: '📌', default: defaultToggles.includes('ignore_pinned') },
                    { label: t('menus.safety.toggles.bots', lang), value: 'ignore_bots', description: 'Nunca apagar mensagens de bots', emoji: '🤖', default: defaultToggles.includes('ignore_bots') },
                    { label: t('menus.safety.toggles.system', lang), value: 'ignore_system', description: 'Nunca apagar mensagens do sistema', emoji: '⚙️', default: defaultToggles.includes('ignore_system') }
                ])
        );

        const currentAge = exclusions.minAge !== undefined ? exclusions.minAge : 5;
        const rowAge = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_cleaning_safety_age')
                .setPlaceholder('⏰ Proteção por Idade...')
                .addOptions([
                    { label: t('menus.safety.age.off', lang), value: '0', description: 'Apagar independente da idade', default: currentAge === 0 },
                    { label: t('menus.safety.age.5m', lang), value: '5', description: 'Proteger mensagens < 5min', default: currentAge === 5 },
                    { label: t('menus.safety.age.10m', lang), value: '10', description: 'Proteger mensagens < 10min', default: currentAge === 10 },
                    { label: t('menus.safety.age.30m', lang), value: '30', description: 'Proteger mensagens < 30min', default: currentAge === 30 },
                    { label: t('menus.safety.age.1h', lang), value: '60', description: 'Proteger mensagens < 1h', default: currentAge === 60 },
                    { label: t('menus.safety.age.24h', lang), value: '1440', description: 'Proteger mensagens < 1 dia', default: currentAge === 1440 },
                ])
        );

        const currentReactions = exclusions.minReactions || 0;
        const rowReactions = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_cleaning_safety_reactions')
                .setPlaceholder('👍 Proteção por Reações...')
                .addOptions([
                    { label: t('menus.safety.reactions.off', lang), value: '0', description: 'Ignorar reações', default: currentReactions === 0 },
                    { label: t('menus.safety.reactions.3', lang), value: '3', emoji: '3️⃣', default: currentReactions === 3 },
                    { label: t('menus.safety.reactions.5', lang), value: '5', emoji: '5️⃣', default: currentReactions === 5 },
                    { label: t('menus.safety.reactions.10', lang), value: '10', emoji: '🔟', default: currentReactions === 10 },
                    { label: t('menus.safety.reactions.20', lang), value: '20', emoji: '🔥', default: currentReactions === 20 },
                ])
        );

        const roles = interaction.guild.roles.cache
            .filter(r => !r.managed && r.name !== '@everyone')
            .map(r => ({ label: r.name, value: r.id }))
            .slice(0, 25);
        if (roles.length === 0) roles.push({ label: 'Nenhum cargo disponível', value: 'none', description: 'Sem cargos disponíveis', emoji: '⚠️' });

        const currentRoles = exclusions.ignoreRoles || [];

        const rowRoles = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_cleaning_safety_roles')
                .setPlaceholder('👮 Cargos Protegidos...')
                .setMinValues(0)
                .setMaxValues(roles.length > 1 ? Math.min(roles.length, 5) : 1)
                .addOptions(roles.map(r => ({ ...r, default: currentRoles.includes(r.value) })))
        );

        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_back_cleaning')
                .setLabel('🔙 Voltar')
                .setStyle(ButtonStyle.Secondary)
        );

        const payload = { embeds: [embed], components: [rowToggles, rowAge, rowReactions, rowRoles, rowBack], ephemeral: true };
        if (isUpdate) await interaction.update(payload);
        else await interaction.reply(payload);
    },

    async showAntiSpamMenu(interaction, { t, lang }, isUpdate = false) {
        const config = ConfigService.get(interaction.guildId);
        const spamConfig = config.antispam || { enabled: false, actions: ['delete'], blockFlood: true, blockRepeated: true };

        const isEnabled = spamConfig.enabled;
        const statusText = isEnabled ? "ATIVADO" : "DESATIVADO";
        const color = isEnabled ? '#00FF00' : '#FF0000';

        const embed = new EmbedBuilder()
            .setTitle(t('menus.antispam.title', lang))
            .setDescription(t('menus.antispam.description', lang) + `\n\n**${t('menus.antispam.status', lang, { status: statusText })}**`)
            .setColor(color);

        const activeDefaults = [];
        if (spamConfig.blockFlood) activeDefaults.push('detect_flood');
        if (spamConfig.blockRepeated) activeDefaults.push('detect_repeated');
        if (spamConfig.blockLinks) activeDefaults.push('detect_links');
        if (spamConfig.actions?.includes('delete')) activeDefaults.push('delete');
        if (spamConfig.actions?.includes('mute')) activeDefaults.push('mute');

        const rowConfig = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_antispam_config')
                .setPlaceholder(t('menus.antispam.placeholder_actions', lang))
                .setMinValues(1)
                .setMaxValues(5)
                .addOptions([
                    { label: t('menus.antispam.config_flood', lang), value: 'detect_flood', emoji: '🌊', default: activeDefaults.includes('detect_flood') },
                    { label: t('menus.antispam.config_caps', lang), value: 'detect_repeated', emoji: '🔁', default: activeDefaults.includes('detect_repeated') },
                    { label: t('menus.antispam.config_links', lang), value: 'detect_links', emoji: '🔗', default: activeDefaults.includes('detect_links') },
                    { label: t('menus.antispam.action_delete', lang), value: 'delete', description: 'Ação: Deletar', emoji: '🗑️', default: activeDefaults.includes('delete') },
                    { label: t('menus.antispam.action_mute', lang), value: 'mute', description: 'Ação: Silenciar', emoji: '🔇', default: activeDefaults.includes('mute') }
                ])
        );

        const rowToggle = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_antispam_toggle')
                .setLabel(t('menus.antispam.btn_toggle', lang, { status: isEnabled ? t('menus.deactivate', lang) : t('menus.activate', lang) }))
                .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('btn_back_main')
                .setLabel(t('menus.back', lang))
                .setStyle(ButtonStyle.Secondary)
        );

        const payload = { embeds: [embed], components: [rowConfig, rowToggle], ephemeral: true };
        if (isUpdate) await interaction.update(payload);
        else await interaction.reply(payload);
    },

    async showLogsMenu(interaction, { t, lang }, isUpdate = false) {
        const logs = LogService.get(interaction.guildId, 15);

        const emojiMap = {
            CLEAN_RULE_UPDATED: '⚙️',
            CLEAN_EXECUTED_MANUAL: '🗑️',
            CLEAN_EXECUTED_AUTO: '🤖',
            CLEAN_EXECUTED_SCHEDULED: '⏰',
            ANTISPAM_UPDATED: '🛡️',
            ANTISPAM_TRIGGERED: '🚨',
            DATE_CREATED: '📅',
            DATE_REMOVED: '🗑️',
            DATE_TRIGGERED: '🎉',
            PERMISSION_UPDATED: '🔑',
            LANGUAGE_CHANGED: '🌐',
            TIMEZONE_CHANGED: '🌍',
            CHANNEL_UPDATED: '📢',
            SCHEDULE_UPDATED: '📆',
            WINDOW_UPDATED: '🪟',
            CONFIG_RESET: '🔄',
            SYSTEM_SKIP: '⏭️'
        };

        const embed = new EmbedBuilder()
            .setTitle(t('menus.logs.title', lang))
            .setColor('#FFFF00')
            .setFooter({ text: t('menus.logs.footer', lang) });

        if (logs.length === 0) {
            embed.setDescription(t('menus.logs.empty', lang));
        } else {
            const lines = [...logs].reverse().map(l => {
                const date = new Date(l.timestamp);
                const dateStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const emoji = emojiMap[l.type] || '📝';

                const channelInfo = l.channelId ? `<#${l.channelId}>` : 'System';
                const userTag = l.username || 'System';

                return `\`${dayStr} ${dateStr}\` ${emoji} **${userTag}** | ${channelInfo}\n└ ${l.description}`;
            });

            embed.setDescription(lines.join('\n\n').substring(0, 4000));
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_logs_refresh')
                .setLabel(t('menus.logs.btn_refresh', lang))
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('btn_logs_clear')
                .setLabel(t('menus.logs.btn_clear', lang))
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('btn_back_main')
                .setLabel(t('menus.back', lang))
                .setStyle(ButtonStyle.Secondary)
        );

        const payload = { embeds: [embed], components: [row], ephemeral: true };
        if (isUpdate) {
            await interaction.update(payload);
        } else {
            await interaction.reply(payload);
        }
    },

    async showDatesMenu(interaction, { t, lang }, isUpdate = false) {
        const config = ConfigService.get(interaction.guildId);
        const datesConfig = config.dates || {};
        const customs = datesConfig.customs || [];

        const embed = new EmbedBuilder()
            .setTitle(t('dates.embed_title', lang))
            .setColor('#E91E63');

        // Field: Datas Registradas
        let registeredValue = '';
        if (customs.length > 0) {
            registeredValue = customs.map(c => {
                const userTag = c.userId ? `<@${c.userId}>` : '(Sistema)';
                const channelTag = `<#${c.channelId}>`;
                const d = String(c.day).padStart(2, '0');
                const m = String(c.month).padStart(2, '0');
                return `🎂 **${c.name}**\n📆 ${d}/${m} | 📢 ${channelTag} | 👤 ${userTag}`;
            }).join('\n\n');
        } else {
            registeredValue = t('dates.field_none', lang);
        }

        embed.addFields({ name: t('dates.field_registered', lang), value: registeredValue });

        const components = [];

        // Select Menu para Remover
        if (customs.length > 0) {
            components.push(new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('btn_dates_delete_select')
                    .setPlaceholder(t('dates.btn_remove', lang))
                    .addOptions(customs.map(c => ({
                        label: `${c.name} (${String(c.day).padStart(2, '0')}/${String(c.month).padStart(2, '0')})`,
                        value: `btn_dates_delete_${c.id}`,
                        emoji: '🗑️'
                    })))
            ));
        }

        // Botões de Ação
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_dates_new') // Mantive ID original pois já há handler para ele
                .setLabel(t('dates.btn_add', lang))
                .setStyle(ButtonStyle.Success)
                .setDisabled(customs.length >= 5),
            new ButtonBuilder()
                .setCustomId('btn_dates_refresh')
                .setLabel(t('dates.btn_refresh', lang))
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('btn_back_main')
                .setLabel(t('menus.back', lang))
                .setStyle(ButtonStyle.Secondary)
        ));

        const payload = { embeds: [embed], components, ephemeral: true };
        if (isUpdate) await interaction.update(payload);
        else await interaction.reply(payload);
    },

    async showSecurityMenu(interaction, { t, lang }) {
        const config = ConfigService.get(interaction.guildId);
        const currentChannel = config.security?.notificationChannel;

        const embed = new EmbedBuilder()
            .setTitle(t('menus.security.title', lang))
            .setDescription(t('menus.security.description', lang) + (currentChannel ? `\n\n${t('menus.security.notifications_title', lang)}: <#${currentChannel}>` : ''))
            .setColor('#ED4245');

        const roles = interaction.guild.roles.cache
            .filter(r => !r.managed && r.name !== '@everyone')
            .map(r => ({ label: r.name, value: r.id }))
            .slice(0, 25);

        if (roles.length === 0) {
            roles.push({ label: 'Nenhum cargo disponível', value: 'none', description: 'Crie cargos no servidor primeiro', emoji: '⚠️' });
        }

        const rowRoles = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_security_role')
                .setPlaceholder(t('menus.security.placeholder_roles', lang))
                .setMinValues(0)
                .setMaxValues(roles.length > 1 ? Math.min(roles.length, 10) : 1)
                .addOptions(roles)
        );

        const rowChannel = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('menu_security_channel')
                .setPlaceholder(t('menus.security.notifications_desc', lang) || "Selecione o Canal de Notificações")
                .setChannelTypes([ChannelType.GuildText])
        );

        const rowTimezone = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_timezone_select')
                .setPlaceholder(t('status.field_timezone', lang))
                .addOptions([
                    { label: 'UTC (Default)', value: 'UTC' },
                    { label: 'São Paulo (BRT)', value: 'America/Sao_Paulo' },
                    { label: 'New York (EST)', value: 'America/New_York' },
                    { label: 'London (GMT)', value: 'Europe/London' },
                    { label: 'Tokyo (JST)', value: 'Asia/Tokyo' }
                ])
        );

        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_back_main')
                .setLabel('🔙 Voltar')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [rowRoles, rowChannel, rowTimezone, rowBack], ephemeral: true });
    },

};

module.exports = CentralInteractionHandler;
