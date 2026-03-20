const { Events } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const LocaleService = require('../services/LocaleService');
const interactionHandler = require('../handlers/centralInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const start = Date.now();
        const latency = start - interaction.createdTimestamp;

        if (latency > 2000) {
            console.warn(`[InteractionCreate] ⚠️ Interação recebida com ALTO ATRASO (${latency}ms). Provável lentidão no Render.`);
        }
        
        if (interaction.isChatInputCommand()) {
            try {
                await interaction.deferReply({ ephemeral: true });
            } catch (e) {
                console.error(`[InteractionCreate] ❌ Erro Crítico no Defer (${interaction.id}): ${e.message}`);
                return;
            }
        }

        const guildId = interaction.guildId;
        const config = ConfigService.get(guildId);
        const lang = config.language;

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
                return;
            }

            try {
                await command.execute(interaction, { client, config, lang, t: LocaleService.t.bind(LocaleService) });
                
                const duration = Date.now() - start;
                if (duration > 2500) {
                    console.warn(`[InteractionCreate] Comando /${interaction.commandName} demorou ${duration}ms para processar!`);
                }
            } catch (error) {
                console.error(`Erro ao executar ${interaction.commandName}`);
                console.error(error);
                
                const errorPayload = { content: 'Houve um erro ao executar este comando!', ephemeral: true };
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorPayload);
                    } else {
                        await interaction.reply(errorPayload);
                    }
                } catch (e) {
                    console.error('Falha ao enviar mensagem de erro:', e.message);
                }
            }
        } else {
            try {
                await interactionHandler.handle(interaction, { client, config, lang, t: LocaleService.t.bind(LocaleService) });
            } catch (error) {
                console.error('Erro no interactionHandler:', error);
            }
        }
    },
};
