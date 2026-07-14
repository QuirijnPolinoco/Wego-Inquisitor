import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { loadCommands } from './handlers/commandHandler.js';

/**
 * Registers slash commands with Discord. Run this whenever you add, remove, or
 * change a command's `data` (name/description/options):
 *
 *   npm run deploy
 *
 * If GUILD_ID is set, commands register to that guild and appear instantly —
 * best for development. Otherwise they register globally (can take up to ~1h
 * to propagate).
 */
async function deploy() {
  const commands = await loadCommands();
  const body = [...commands.values()].map((command) => command.data.toJSON());

  const rest = new REST().setToken(config.token);

  if (config.guildId) {
    const data = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body },
    );
    logger.info(`Registered ${data.length} guild command(s) to ${config.guildId}.`);
  } else {
    const data = await rest.put(Routes.applicationCommands(config.clientId), { body });
    logger.info(`Registered ${data.length} global command(s).`);
  }
}

deploy().catch((err) => {
  logger.error('Failed to deploy commands:', err);
  process.exit(1);
});
