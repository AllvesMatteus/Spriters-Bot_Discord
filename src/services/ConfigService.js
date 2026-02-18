const fs = require('fs');
const path = require('path');
const { DEFAULTS } = require('../config/constants');

const CONFIG_PATH = path.join(__dirname, '../../data/guildConfigs.json');

// Garante que o diretório de dados exista
if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

class ConfigService {
    constructor() {
        this.configs = {};
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                this.configs = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
            }
        } catch (err) {
            console.error('[ConfigService] Falha ao carregar configurações:', err);
            this.configs = {};
        }
    }

    save() {
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.configs, null, 2));
        } catch (err) {
            console.error('[ConfigService] Falha ao salvar configurações:', err);
        }
    }

    get(guildId) {
        return this.configs[guildId] || {
            language: DEFAULTS.LANGUAGE,
            toxicityLevel: DEFAULTS.TOXICITY_LEVEL,
            cleaning: {}
        };
    }

    update(guildId, updates) {
        const current = this.get(guildId);
        this.configs[guildId] = { ...current, ...updates };
        this.save();
        return this.configs[guildId];
    }
}

module.exports = new ConfigService();
