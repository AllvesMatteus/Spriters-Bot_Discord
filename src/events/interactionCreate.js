const { Events, MessageFlags } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const LocaleService = require('../services/LocaleService');
const interactionHandler = require('../handlers/centralInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // RESPOSTA IMEDIATA: Avisa o Discord para "aguardar" (em menos de 100ms)
        if (interaction.isChatInputCommand()) {
            try {
                // flags: [64] = Ephemeral (Apenas o usuário vê a mensagem)
                await interaction.deferReply({ flags: [64] }).catch(() => {});
            } catch (e) {
                return;
            }
        } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
            // Para botões e menus, fazemos o deferUpdate para não travar a UI
            await interaction.deferUpdate().catch(() => {});
        }

        const start = Date.now();
        const latency = start - interaction.createdTimestamp;

        if (latency > 2500) {
            console.warn(`[InteractionCreate] ⚠️ Interação recebida com ALTO ATRASO (${latency}ms). Provável lerdeza extrema do Render.`);
        }

        const guildId = interaction.guildId;
        const config = ConfigService.get(guildId);
        const lang = config.language || 'pt-BR';

        // Lógica para Comandos de Chat
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
                return;
            }

            try {
                const t = LocaleService.t.bind(LocaleService);
                await command.execute(interaction, { client, config, lang, t });
                
                const duration = Date.now() - start;
                if (duration > 2000) {
                    console.warn(`[InteractionCreate] Comando /${interaction.commandName} demorou ${duration}ms para processar!`);
                }
            } catch (error) {
                console.error(`Erro ao executar /${interaction.commandName}`, error);
                
                const errorPayload = { content: '❌ Houve um erro interno ao processar este comando.', flags: [64] };
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.followUp(errorPayload);
                    } else {
                        await interaction.reply(errorPayload);
                    }
                } catch (e) {
                    console.error('Falha ao reportar erro ao usuário:', e.message);
                }
            }
        } else {
            // Lógica para Botões e Menus (centralizada no InteractionHandler)
            try {
                const t = LocaleService.t.bind(LocaleService);
                await interactionHandler.handle(interaction, { client, config, lang, t });
            } catch (error) {
                console.error('Erro no centralInteractionHandler:', error);
            }
        }
    },
};
