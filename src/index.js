import { config } from './config.js';
import { logger } from './logger.js';
import { createClient } from './client.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { pendingMembers } from './store/pendingMembers.js';

async function main() {
  // Restore the pending-member list from disk before we start reacting to events.
  await pendingMembers.init();

  const client = createClient();
  client.commands = await loadCommands();
  await loadEvents(client);

  // Fail loudly rather than dying silently on an unhandled rejection.
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection:', reason));
  process.on('uncaughtException', (err) => logger.error('Uncaught exception:', err));

  const shutdown = (signal) => {
    logger.info(`Received ${signal}; shutting down.`);
    client.destroy();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await client.login(config.token);
}

main().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});
