const { Events } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const LocaleService = require('../services/LocaleService');
const interactionHandler = require('../handlers/centralInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
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
                // Defer para evitar timeout no Render (limite de 3s do Discord)
                // Quase todos os comandos administrativos são efêmeros
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                }

                // Executa o comando
                await command.execute(interaction, { client, config, lang, t: LocaleService.t.bind(LocaleService) });
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
