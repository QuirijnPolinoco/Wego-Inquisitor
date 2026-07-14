import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { Collection } from 'discord.js';
import { logger } from '../logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = join(__dirname, '..', 'commands');

/**
 * Auto-loads every command module in src/commands.
 *
 * A command file exports:
 *   - data:      a SlashCommandBuilder (required)
 *   - execute(interaction):   handle the chat-input command (required)
 *   - autocomplete(interaction):  optional, for suggestion boxes
 *
 * Drop a new file in src/commands and it is picked up automatically — no
 * central registry to edit.
 */
export async function loadCommands() {
  const commands = new Collection();
  const files = (await readdir(COMMANDS_DIR)).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const mod = await import(pathToFileURL(join(COMMANDS_DIR, file)).href);
    const command = mod.default ?? mod;
    if (!command?.data || typeof command.execute !== 'function') {
      logger.warn(`Skipping ${file}: missing "data" or "execute" export.`);
      continue;
    }
    commands.set(command.data.name, command);
    logger.debug(`Loaded command /${command.data.name}`);
  }

  logger.info(`Loaded ${commands.size} command(s).`);
  return commands;
}
