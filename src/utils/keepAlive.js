const https = require('https');

function formatUptime(ms) {
    const totalMin = Math.floor(ms / (1000 * 60));
    const totalHours = Math.floor(totalMin / 60);
    const totalDays = Math.floor(totalHours / 24);

    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;
    const hours = totalHours % 24;

    let parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);

    if (parts.length === 0) {
        return 'menos de 1 hora';
    }

    if (parts.length > 1) {
        const last = parts.pop();
        return parts.join(', ') + ' e ' + last;
    }

    return parts[0];
}

function startKeepAlive() {
    // RENDER_EXTERNAL_URL é uma variável injetada automaticamente pelo Render
    const url = process.env.RENDER_EXTERNAL_URL;

    if (url) {
        console.log(`[KeepAlive] Ativando a manutenção para evitar que o Render hiberne.`);
        console.log(`[KeepAlive] URL do Serviço: ${url}`);

        // 12 minutos em milissegundos
        const intervalo = 12 * 60 * 1000;
        const startTime = Date.now();
        let lastLogTime = Date.now();

        setInterval(() => {
            https.get(url, (res) => {
                const agora = Date.now();

                // Logamos todos os pings (a cada 12 min) para confirmar que o bot não dormiu
                const uptimeString = formatUptime(agora - startTime);
                const horaLocal = new Date().toLocaleTimeString('pt-BR');
                console.log(`[KeepAlive - ${horaLocal}] 🟢 PING BEM-SUCEDIDO (${res.statusCode}). Serviço ativo há ${uptimeString}!`);
            }).on('error', (err) => {
                const horaLocal = new Date().toLocaleTimeString('pt-BR');
                console.error(`[KeepAlive - ${horaLocal}] 🔴 FALHA ao tentar pingar o bot: ${err.message}`);
            });
        }, intervalo);
    } else {
        console.log('[KeepAlive] A variável "RENDER_EXTERNAL_URL" não foi encontrada. Ignorando processo anti-hibernação (provavelmente estamos rodando localmente).');
    }
}

module.exports = startKeepAlive;
