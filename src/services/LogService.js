const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../../data/logs');

// Garante existência do diretório
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

class LogService {
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

    add(guildId, type, userTag, details) {
        const logs = this._read(guildId);

        const entry = {
            timestamp: new Date().toISOString(),
            type,
            user: userTag,
            details
        };

        // Adiciona ao início e limita
        logs.unshift(entry);
        if (logs.length > 50) logs.length = 50; // Trim in place

        this._write(guildId, logs);
        return entry;
    }

    get(guildId, limit = 10) {
        const logs = this._read(guildId);
        return logs.slice(0, limit);
    }

    clear(guildId) {
        this._write(guildId, []);
    }
}

module.exports = new LogService();
