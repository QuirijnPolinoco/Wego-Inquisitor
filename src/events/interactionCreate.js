import { Events, MessageFlags } from 'discord.js';
import { logger } from '../logger.js';

/**
 * Central dispatcher for all interactions.
 * Routes chat-input commands to command.execute and autocomplete requests
 * (the "suggestion boxes") to command.autocomplete.
 */
export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Autocomplete — powers the arrow-key suggestion boxes.
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return;
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        logger.error(`Autocomplete for /${interaction.commandName} failed:`, err);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Received unknown command: /${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error(`Command /${interaction.commandName} failed:`, err);
      const payload = {
        content: '⚠️ Something went wrong running that command.',
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
