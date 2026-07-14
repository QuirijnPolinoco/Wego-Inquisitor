import 'dotenv/config';

/**
 * Central, validated configuration loaded once at startup.
 * Every module imports from here rather than reading process.env directly,
 * so new settings live in one predictable place.
 */

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env and fill it in.`,
    );
  }
  return value.trim();
}

function optional(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function intOption(name, fallback) {
  const raw = optional(name);
  if (raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer, got "${raw}".`);
  }
  return parsed;
}

function listOption(name) {
  return optional(name)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  // Optional: when set, commands register to this guild instantly.
  guildId: optional('GUILD_ID'),

  newWegosRole: {
    id: optional('NEW_WEGOS_ROLE_ID'),
    name: optional('NEW_WEGOS_ROLE_NAME', 'New Wegos'),
  },

  joinRoleDelayMs: intOption('JOIN_ROLE_DELAY_MINUTES', 60) * 60 * 1000,
  sweepIntervalMs: intOption('SWEEP_INTERVAL_SECONDS', 60) * 1000,

  assignableRanks: listOption('ASSIGNABLE_RANKS'),

  logLevel: optional('LOG_LEVEL', 'info'),
};
