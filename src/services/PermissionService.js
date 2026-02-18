const { PermissionsBitField } = require('discord.js');
const ConfigService = require('./ConfigService');

class PermissionService {
    /**
     * Verifica se um membro tem permissão para realizar ações sensíveis
     * @param {GuildMember} member - Membro do Servidor Discord
     * @returns {boolean}
     */
    canManageBot(member) {
        if (!member) return false;

        // 1. Verifica permissão de Administrador do Servidor (Sobrescrita Hardcoded)
        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

        // 2. Verifica se é o dono do servidor
        if (member.guild.ownerId === member.id) return true;

        // 3. Verifica cargos autorizados específicos configurados no bot
        const config = ConfigService.get(member.guild.id);
        const authorizedRoles = config.security?.authorizedRoles || [];

        if (authorizedRoles.length > 0) {
            return member.roles.cache.some(role => authorizedRoles.includes(role.id));
        }

        return false;
    }

    /**
     * Atualiza cargos autorizados para um servidor
     * @param {string} guildId 
     * @param {string[]} roleIds 
     */
    setAuthorizedRoles(guildId, roleIds) {
        const currentConfig = ConfigService.get(guildId);
        const security = currentConfig.security || {};

        security.authorizedRoles = roleIds;

        ConfigService.update(guildId, { security });
    }

    getAuthorizedRoles(guildId) {
        const config = ConfigService.get(guildId);
        return config.security?.authorizedRoles || [];
    }
}

module.exports = new PermissionService();
