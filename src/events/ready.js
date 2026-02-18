const { Events, ActivityType } = require('discord.js');
const LocaleService = require('../services/LocaleService');
const DateService = require('../services/DateService');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        client.user.setActivity('julgando vocês', { type: ActivityType.Playing });

        // Inicializa Serviços
        DateService.init(client);

        // Inicializa Scheduler de Limpeza
        const CleaningService = require('../services/CleaningService');
        CleaningService.initScheduler(client);
    },
};
