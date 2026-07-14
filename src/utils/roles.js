import { config } from '../config.js';

/**
 * Resolve the configured "New Wegos" role for a guild.
 * Prefers the role ID; falls back to a case-insensitive name match.
 * Returns the Role or null if not found.
 */
export function resolveNewWegosRole(guild) {
  const { id, name } = config.newWegosRole;
  if (id) {
    const byId = guild.roles.cache.get(id);
    if (byId) return byId;
  }
  if (name) {
    const lower = name.toLowerCase();
    return guild.roles.cache.find((role) => role.name.toLowerCase() === lower) ?? null;
  }
  return null;
}

/**
 * Roles that /give-rank may assign, filtered so the bot can actually manage
 * them (role is below the bot's highest role and not managed/@everyone).
 *
 * If ASSIGNABLE_RANKS is configured, only those names are offered; otherwise
 * every manageable role is offered.
 */
export function assignableRoles(guild) {
  const me = guild.members.me;
  const botHighest = me ? me.roles.highest.position : 0;
  const allowNames = config.assignableRanks.map((n) => n.toLowerCase());

  return [...guild.roles.cache.values()]
    .filter((role) => {
      if (role.id === guild.id) return false; // @everyone
      if (role.managed) return false; // integration/bot-managed roles
      if (role.position >= botHighest) return false; // above the bot — can't assign
      if (allowNames.length > 0 && !allowNames.includes(role.name.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.position - a.position);
}
