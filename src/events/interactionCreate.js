const { Events } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const LocaleService = require('../services/LocaleService');
const interactionHandler = require('../handlers/centralInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const start = Date.now();
        const latency = start - interaction.createdTimestamp;

        // Log de diagnóstico para entender atrasos no Render
        if (latency > 2000) {
            console.warn(`[InteractionCreate] ⚠️ Interação recebida com ALTO ATRASO (${latency}ms). Provável lentidão no Render.`);
        }
        
        // Defer IMEDIATAMENTE para garantir a interação no Discord
        // O limite é de 3 segundos. No Render Free, cada milissegundo conta.
        if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isStringSelectMenu()) {
            try {
                // Tenta dar defer. Se já passou de 3s, isso vai falhar com "Unknown Interaction"
                if (interaction.isChatInputCommand()) {
                    await interaction.deferReply({ ephemeral: true });
                } else {
                    // Para botões e menus, usamos deferUpdate para evitar o erro de "aplicativo não respondeu"
                    // enquanto o bot processa a próxima tela
                    await interaction.deferUpdate().catch(() => {});
                }
            } catch (e) {
                console.error(`[InteractionCreate] ❌ Erro Crítico no Defer (${interaction.id}): ${e.message}`);
                // Se falhou aqui, não adianta continuar, a interação expirou no Discord
                return;
            }
        }

        const guildId = interaction.guildId;
        const config = ConfigService.get(guildId);
        const lang = config.language;

        // Tratamento de Comandos
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
                return;
            }

            try {
                // Executa o comando (já deu defer acima)
                await command.execute(interaction, { client, config, lang, t: LocaleService.t.bind(LocaleService) });
                
                const duration = Date.now() - start;
                if (duration > 2500) {
                    console.warn(`[InteractionCreate] Comando /${interaction.commandName} demorou ${duration}ms para processar!`);
                }
            } catch (error) {
                console.error(`Erro ao executar ${interaction.commandName}`);
                console.error(error);
                
                // Tenta avisar o usuário do erro de forma segura
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
        }
        // Outras interações (Botões, Menus)
        else {
            try {
                await interactionHandler.handle(interaction, { client, config, lang, t: LocaleService.t.bind(LocaleService) });
            } catch (error) {
                console.error('Erro no interactionHandler:', error);
            }
        }
    },
};
