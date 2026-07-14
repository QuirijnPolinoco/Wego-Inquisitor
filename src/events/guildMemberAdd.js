import { Events } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { pendingMembers } from '../store/pendingMembers.js';
import { resolveNewWegosRole } from '../utils/roles.js';

/**
 * When a member joins we do NOT give them the New Wegos role right away.
 * Instead we record them as pending; the scheduler grants the role once the
 * configured delay has elapsed. Until then they hold only @everyone — which,
 * after running /setup, cannot send messages.
 *
 * If the member somehow already has the role (e.g. a rejoin with sticky
 * roles), we leave them alone.
 */
export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (member.user.bot) return;

    const role = resolveNewWegosRole(member.guild);
    if (role && member.roles.cache.has(role.id)) {
      logger.debug(`${member.user.tag} already has "${role.name}"; not scheduling.`);
      return;
    }

    const now = Date.now();
    await pendingMembers.add({
      guildId: member.guild.id,
      userId: member.id,
      joinedAt: now,
      grantAt: now + config.joinRoleDelayMs,
    });

    logger.info(
      `${member.user.tag} joined ${member.guild.name}; ` +
        `New Wegos role scheduled in ${config.joinRoleDelayMs / 60000} minute(s).`,
    );
  },
};
