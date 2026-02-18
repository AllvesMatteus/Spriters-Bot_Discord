const { SlashCommandBuilder } = require('discord.js');
const CentralInteractionHandler = require('../../handlers/centralInteractionHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dates')
        .setDescription('Gerencia e lista datas comemorativas personalizadas.'),
    async execute(interaction, context) {
        await CentralInteractionHandler.showDatesMenu(interaction, context);
    },
};
