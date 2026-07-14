import { SlashCommandBuilder, MessageFlags } from 'discord.js';

/**
 * Example command — the whole template for adding a new one.
 * Create a file in src/commands exporting `data` + `execute` and it's live
 * after `npm run deploy`.
 */
export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot is alive.'),

  async execute(interaction) {
    const latency = Math.round(interaction.client.ws.ping);
    await interaction.reply({
      content: `🏓 Pong! WebSocket latency: **${latency}ms**.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
