const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const LocaleService = require('../services/LocaleService');

const ConfigService = require('../services/ConfigService');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild, client) {
        console.log(`[Guild] Joined ${guild.name} (${guild.id})`);

        // Detecção Inteligente de Idioma
        let lang = 'pt-BR';
        if (guild.preferredLocale === 'en-US') {
            lang = 'en-US';
        }
        // Caso contrário: Usar en-US como fallback
        else if (guild.preferredLocale !== 'pt-BR') {
            lang = 'en-US';
        }

        // Salva Configuração imediatamente
        ConfigService.update(guild.id, { language: lang });

        // Encontra um canal adequado para enviar a mensagem de boas-vindas
        const channel = guild.systemChannel ||
            guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(guild.members.me).has('SendMessages'));

        if (!channel) return;

        const t = (key) => LocaleService.t(key, lang);

        const embed = new EmbedBuilder()
            .setTitle(t('onboarding.title'))
            .setDescription(t('onboarding.description'))
            .setColor('#9933ff')
            .addFields({ name: t('onboarding.field_name'), value: t('onboarding.field_value') });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('onboarding_configure')
                .setLabel(t('onboarding.btn_config'))
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⚙️'),
            new ButtonBuilder()
                .setLabel(t('onboarding.btn_site'))
                .setStyle(ButtonStyle.Link)
                .setURL('https://spriters-bot.com')
        );

        await channel.send({ embeds: [embed], components: [row] });
    },
};
