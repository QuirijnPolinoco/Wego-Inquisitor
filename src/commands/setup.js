import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ChannelType,
} from 'discord.js';
import { resolveNewWegosRole } from '../utils/roles.js';

// Permissions that constitute "being able to talk" in a channel.
const TALK_PERMISSIONS = [
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.CreatePrivateThreads,
  PermissionFlagsBits.AddReactions,
];

const CONFIGURABLE_CHANNEL_TYPES = new Set([
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildForum,
  ChannelType.GuildVoice,
  ChannelType.GuildStageVoice,
]);

/**
 * /setup
 *
 * Enforces the "muted until verified" rule so it doesn't depend on manual
 * server config: in every channel it denies the talk permissions to @everyone
 * and allows them for the New Wegos role. New members (who only have
 * @everyone until the 1-hour delay elapses) therefore can't send messages
 * until the bot grants them New Wegos.
 */
export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Lock every channel so only New Wegos (and above) can talk.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    const guild = interaction.guild;
    const role = resolveNewWegosRole(guild);
    if (!role) {
      await interaction.reply({
        content:
          '❌ Could not find the **New Wegos** role. Set `NEW_WEGOS_ROLE_ID` or ' +
          '`NEW_WEGOS_ROLE_NAME` in the bot config, then try again.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const everyone = guild.roles.everyone;
    const denyForEveryone = Object.fromEntries(TALK_PERMISSIONS.map((p) => [p, false]));
    const allowForRole = Object.fromEntries(TALK_PERMISSIONS.map((p) => [p, true]));

    let updated = 0;
    let failed = 0;
    for (const channel of guild.channels.cache.values()) {
      if (!CONFIGURABLE_CHANNEL_TYPES.has(channel.type)) continue;
      try {
        await channel.permissionOverwrites.edit(everyone, denyForEveryone, {
          reason: 'Wego Inquisitor: mute unverified members',
        });
        await channel.permissionOverwrites.edit(role, allowForRole, {
          reason: 'Wego Inquisitor: allow verified members to talk',
        });
        updated += 1;
      } catch {
        failed += 1;
      }
    }

    await interaction.editReply(
      `✅ Locked **${updated}** channel(s): only **${role.name}** and above can send messages.` +
        (failed ? `\n⚠️ Skipped **${failed}** channel(s) I lack permission to edit.` : ''),
    );
  },
};
