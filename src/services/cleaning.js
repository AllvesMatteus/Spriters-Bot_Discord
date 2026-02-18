const mapeamentoIntervalo = {
    '30s': { ms: 30 * 1000, texto: '30 segundos' },
    '1m': { ms: 1 * 60 * 1000, texto: '1 minuto' },
    '5m': { ms: 5 * 60 * 1000, texto: '5 minutos' },
    '15m': { ms: 15 * 60 * 1000, texto: '15 minutos' },
    '30m': { ms: 30 * 60 * 1000, texto: '30 minutos' },
    '1h': { ms: 1 * 60 * 60 * 1000, texto: '1 hora' },
    '3h': { ms: 3 * 60 * 60 * 1000, texto: '3 horas' },
    '6h': { ms: 6 * 60 * 60 * 1000, texto: '6 horas' },
    '12h': { ms: 12 * 60 * 60 * 1000, texto: '12 horas' },
    '24h': { ms: 24 * 60 * 60 * 1000, texto: '24 horas' },
};

// Estado em memória (CUIDADO: Reseta ao reiniciar o bot)
const intervalosDeLimpeza = {};
const horariosAgendados = {};
const configsLimpeza = {};

function formatarConfigAtual(config) {
    if (!config) return '❌ Status da limpeza: Nenhuma limpeza configurada no momento.';
    if (config.tipo === 'horario') {
        const horarios = config.horas.map((h) => `${h.toString().padStart(2, '0')}:00`).join(', ');
        return `🕒 Status da limpeza: Horários configurados: ${horarios}`;
    }
    if (config.tipo === 'intervalo') {
        return `🔄 Status da limpeza: Intervalo configurado a cada ${config.texto}`;
    }
    return '❓ Status da limpeza: Configuração desconhecida.';
}

async function limparCanal(client, channelId) {
    try {
        const canal = await client.channels.fetch(channelId);
        if (!canal) {
            if (intervalosDeLimpeza[channelId]) {
                clearInterval(intervalosDeLimpeza[channelId]);
                delete intervalosDeLimpeza[channelId];
            }
            return;
        }

        const fetched = await canal.messages.fetch({ limit: 100 });
        const duasSemanasMs = 14 * 24 * 60 * 60 * 1000;
        const agoraMs = Date.now();
        const mensagensParaApagar = fetched.filter(
            (msg) => !msg.pinned && agoraMs - msg.createdTimestamp <= duasSemanasMs
        );

        if (mensagensParaApagar.size === 0) return;

        console.log(`Apagando ${mensagensParaApagar.size} mensagens em #${canal.name}...`);
        await canal.bulkDelete(mensagensParaApagar, true);
        console.log(`Limpeza do canal #${canal.name} concluída.`);

    } catch (error) {
        console.error(`Erro ao tentar limpar o canal ${channelId}:`, error);
    }
}

function agendarLimpezaPorHorario(client, channelId, horas) {
    if (horariosAgendados[channelId]) {
        horariosAgendados[channelId].forEach((timeout) => clearTimeout(timeout));
    }
    horariosAgendados[channelId] = [];

    horas.forEach((hora) => {
        const verificarEExecutar = () => {
            const agora = new Date();
            if (agora.getHours() === hora) {
                limparCanal(client, channelId);
            }
            // Verifica a cada minuto para não perder o horário
            // Nota: Isso cria muitos timeouts, mas é a lógica original preservada
            horariosAgendados[channelId].push(setTimeout(verificarEExecutar, 60 * 1000));
        };
        verificarEExecutar();
    });
}

function stopCleaning(channelId) {
    if (intervalosDeLimpeza[channelId]) {
        clearInterval(intervalosDeLimpeza[channelId]);
        delete intervalosDeLimpeza[channelId];
    }
    if (horariosAgendados[channelId]) {
        horariosAgendados[channelId].forEach((timeout) => clearTimeout(timeout));
        delete horariosAgendados[channelId];
    }
    delete configsLimpeza[channelId];
}

module.exports = {
    mapeamentoIntervalo,
    intervalosDeLimpeza,
    horariosAgendados,
    configsLimpeza,
    formatarConfigAtual,
    limparCanal,
    agendarLimpezaPorHorario,
    stopCleaning
};
