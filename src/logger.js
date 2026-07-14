import { config } from './config.js';

/**
 * Tiny leveled logger — no dependency, timestamped, level-filtered.
 * Swap the body for pino/winston later without touching call sites.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

function emit(level, args) {
  if (LEVELS[level] < threshold) return;
  const stamp = new Date().toISOString();
  const line = `${stamp} [${level.toUpperCase()}]`;
  const sink = level === 'error' || level === 'warn' ? console.error : console.log;
  sink(line, ...args);
}

export const logger = {
  debug: (...args) => emit('debug', args),
  info: (...args) => emit('info', args),
  warn: (...args) => emit('warn', args),
  error: (...args) => emit('error', args),
};
