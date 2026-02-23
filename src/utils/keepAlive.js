const https = require('https');

/**
 * Função responsável por manter o serviço acordado 24 horas.
 * O Render.com coloca projetos gratuitos para dormir após 15 minutos sem requisições externas.
 * Essa função captura a URL exposta automaticamente e faz requisições a cada 14 minutos.
 */
function startKeepAlive() {
    // RENDER_EXTERNAL_URL é uma variável injetada automaticamente pelo Render
    const url = process.env.RENDER_EXTERNAL_URL;

    if (url) {
        console.log(`[KeepAlive] Ativando a manutenção para evitar que o Render hiberne.`);
        console.log(`[KeepAlive] URL do Serviço: ${url}`);

        // 12 minutos em milissegundos
        const intervalo = 12 * 60 * 1000;

        setInterval(() => {
            https.get(url, (res) => {
                const agora = new Date().toLocaleTimeString('pt-BR');
                console.log(`[KeepAlive - ${agora}] 🟢 PING BEM-SUCEDIDO no seu bot (${res.statusCode}). Serviço mantido online e ativo!`);
            }).on('error', (err) => {
                const agora = new Date().toLocaleTimeString('pt-BR');
                console.error(`[KeepAlive - ${agora}] 🔴 FALHA ao tentar pingar o bot: ${err.message}`);
            });
        }, intervalo);
    } else {
        console.log('[KeepAlive] A variável "RENDER_EXTERNAL_URL" não foi encontrada. Ignorando processo anti-hibernação (provavelmente estamos rodando localmente).');
    }
}

module.exports = startKeepAlive;
