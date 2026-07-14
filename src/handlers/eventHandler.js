import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { logger } from '../logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_DIR = join(__dirname, '..', 'events');

/**
 * Auto-loads every event module in src/events and wires it to the client.
 *
 * An event file exports:
 *   - name:   a discord.js Events value (required)
 *   - once:   boolean, register with client.once (optional, default false)
 *   - execute(...args, client):  handler (required)
 *
 * Drop a new file in src/events and it is registered automatically.
 */
export async function loadEvents(client) {
  const files = (await readdir(EVENTS_DIR)).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const mod = await import(pathToFileURL(join(EVENTS_DIR, file)).href);
    const event = mod.default ?? mod;
    if (!event?.name || typeof event.execute !== 'function') {
      logger.warn(`Skipping event ${file}: missing "name" or "execute" export.`);
      continue;
    }
    const bound = (...args) => event.execute(...args, client);
    if (event.once) client.once(event.name, bound);
    else client.on(event.name, bound);
    logger.debug(`Registered event "${event.name}" from ${file}`);
  }

  logger.info('Events registered.');
}
