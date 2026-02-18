const fs = require('fs');
const path = require('path');
const { DEFAULTS } = require('../config/constants');

// Cache de locais na memória
const locales = {};
const availableLocales = ['pt-BR', 'en-US'];

class LocaleService {
    constructor() {
        this.loadLocales();
    }

    loadLocales() {
        availableLocales.forEach(lang => {
            try {
                const filePath = path.join(__dirname, `../locales/${lang}.json`);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                locales[lang] = JSON.parse(fileContent);
                console.log(`[LocaleService] Carregado ${lang}`);
            } catch (err) {
                console.error(`[LocaleService] Falha ao carregar ${lang}:`, err);
            }
        });
    }

    /**
     * Obtém uma string de tradução
     * @param {string} key - Chave em notação de ponto (ex: 'errors.generic')
     * @param {string} lang - Código do idioma (padrão: pt-BR)
     * @param {object} args - Argumentos para substituir na string
     * @returns {string} A string traduzida ou a chave se não encontrada
     */
    t(key, lang = DEFAULTS.LANGUAGE, args = {}) {
        if (!locales[lang]) lang = DEFAULTS.LANGUAGE;

        let value = this._resolve(key, lang);

        // Fallback (Alternativa)
        if (!value && lang !== 'pt-BR') {
            value = this._resolve(key, 'pt-BR');
        }

        // Lidar com array (escolha aleatória para variedade/toxicidade)
        if (Array.isArray(value)) {
            value = value[Math.floor(Math.random() * value.length)];
        }

        if (!value && lang !== 'pt-BR') {
            // Fallback para pt-BR
            value = this.resolve(key, 'pt-BR');
        }

        if (!value) return key;

        // Substituir marcadores (placeholders)
        Object.entries(args).forEach(([k, v]) => {
            value = value.replace(new RegExp(`{${k}}`, 'g'), v);
        });

        return value;
    }

    _resolve(key, lang) {
        let value = locales[lang];
        for (const k of key.split('.')) {
            value = value?.[k];
            if (!value) return null;
        }
        return value;
    }

    getAvailableLocales() {
        return availableLocales;
    }
}

module.exports = new LocaleService();
