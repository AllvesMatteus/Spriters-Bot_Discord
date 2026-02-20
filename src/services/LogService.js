const fs = require('fs');
const path = require('path');
const LOGS_DIR = path.join(__dirname, '../../data/logs');

// Garante existência do diretório
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * ENUM de Tipos de Eventos Padronizados
 */
const LogEvents = {
    CLEAN_RULE_UPDATED: 'CLEAN_RULE_UPDATED',
    CLEAN_EXECUTED_MANUAL: 'CLEAN_EXECUTED_MANUAL',
    CLEAN_EXECUTED_AUTO: 'CLEAN_EXECUTED_AUTO',
    CLEAN_EXECUTED_SCHEDULED: 'CLEAN_EXECUTED_SCHEDULED',
    ANTISPAM_UPDATED: 'ANTISPAM_UPDATED',
    ANTISPAM_TRIGGERED: 'ANTISPAM_TRIGGERED',
    DATE_CREATED: 'DATE_CREATED',
    DATE_REMOVED: 'DATE_REMOVED',
    DATE_TRIGGERED: 'DATE_TRIGGERED',
    PERMISSION_UPDATED: 'PERMISSION_UPDATED',
    LANGUAGE_CHANGED: 'LANGUAGE_CHANGED',
    TIMEZONE_CHANGED: 'TIMEZONE_CHANGED',
    CHANNEL_UPDATED: 'CHANNEL_UPDATED',
    SCHEDULE_UPDATED: 'SCHEDULE_UPDATED',
    WINDOW_UPDATED: 'WINDOW_UPDATED',
    CONFIG_RESET: 'CONFIG_RESET',
    SYSTEM_SKIP: 'SYSTEM_SKIP'
};

class LogService {
    constructor() {
        this.Events = LogEvents;
    }

    _getFilePath(guildId) {
        return path.join(LOGS_DIR, `${guildId}.json`);
    }

    _read(guildId) {
        try {
            const file = this._getFilePath(guildId);
            if (fs.existsSync(file)) {
                return JSON.parse(fs.readFileSync(file, 'utf-8'));
            }
        } catch (err) {
            console.error(`[LogService] Failed to read logs for ${guildId}:`, err);
        }
        return [];
    }

    _write(guildId, logs) {
        try {
            const file = this._getFilePath(guildId);
            fs.writeFileSync(file, JSON.stringify(logs, null, 2));
        } catch (err) {
            console.error(`[LogService] Failed to write logs for ${guildId}:`, err);
        }
    }

    /**
     * Adiciona um novo log com rotação automática em 15 registros
     * @param {string} guildId - ID do servidor
     * @param {object} data { type, user, channelId, description, metadata }
     */
    add(guildId, { type, user, channelId, description, metadata = {} }) {
        if (!this.Events[type]) {
            console.warn(`[LogService] Tipo de evento inválido: ${type}`);
        }

        const logs = this._read(guildId);

        // Objeto de log estruturado
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            userId: user?.id || 'System',
            username: user?.tag || user?.username || 'System',
            channelId: channelId || null,
            description, // Já deve vir traduzida do chamador usando LocaleService
            metadata
        };

        // Rotação: Mantém no máximo 15 registros
        // Ordem cronológica crescente (Antigo [0] -> Novo [end])
        if (logs.length >= 15) {
            logs.shift(); // Remove o mais antigo
        }
        logs.push(entry);

        this._write(guildId, logs);
        return entry;
    }

    /**
     * Obtém logs do servidor
     * @param {string} guildId 
     * @param {number} limit 
     * @returns {Array} Logs ordenados por padrão (mais recentes no final)
     */
    get(guildId, limit = 15) {
        const logs = this._read(guildId);
        return logs.slice(-limit);
    }

    clear(guildId) {
        this._write(guildId, []);
    }
}

module.exports = new LogService();
