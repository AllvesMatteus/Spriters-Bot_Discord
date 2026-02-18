const { Events } = require('discord.js');
const AntiSpamService = require('../services/AntiSpamService');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        // Executa verificação Anti-Spam
        await AntiSpamService.handleMessage(message);
    },
};
