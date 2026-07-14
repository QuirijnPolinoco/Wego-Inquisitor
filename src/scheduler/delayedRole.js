import { config } from '../config.js';
import { logger } from '../logger.js';
import { pendingMembers } from '../store/pendingMembers.js';
import { resolveNewWegosRole } from '../utils/roles.js';

/**
 * Periodically grants the New Wegos role to members whose delay has elapsed.
 *
 * A polling sweep (rather than one setTimeout per member) is deliberate: it
 * survives restarts trivially — on boot we just reload the pending list and
 * the next sweep catches anyone already due, including members whose hour
 * passed while the bot was offline.
 */
export function startDelayedRoleScheduler(client) {
  const tick = () => sweep(client).catch((err) => logger.error('Role sweep failed:', err));
  // Run once shortly after startup, then on the configured interval.
  setTimeout(tick, 5_000);
  const timer = setInterval(tick, config.sweepIntervalMs);
  timer.unref?.();
  logger.info(
    `Delayed-role scheduler started (delay ${config.joinRoleDelayMs / 60000}m, ` +
      `sweep every ${config.sweepIntervalMs / 1000}s).`,
  );
  return timer;
}

async function sweep(client) {
  const due = pendingMembers.due(Date.now());
  if (due.length === 0) return;
  logger.debug(`Sweep: ${due.length} member(s) due for the New Wegos role.`);

  for (const record of due) {
    await grant(client, record);
  }
}

async function grant(client, record) {
  const { guildId, userId } = record;
  try {
    const guild = client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId));
    const role = resolveNewWegosRole(guild);
    if (!role) {
      logger.error(`New Wegos role not found in guild ${guildId}; leaving member pending.`);
      return;
    }

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      // Member left before the delay elapsed — drop them.
      logger.info(`Member ${userId} no longer in guild ${guildId}; removing from pending.`);
      await pendingMembers.remove(guildId, userId);
      return;
    }

    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role, 'Delay elapsed since joining');
      logger.info(`Granted "${role.name}" to ${member.user.tag} in ${guild.name}.`);
    }
    await pendingMembers.remove(guildId, userId);
  } catch (err) {
    // Leave the record in place so the next sweep retries.
    logger.error(`Failed to grant role to ${userId} in ${guildId}:`, err);
  }
}
