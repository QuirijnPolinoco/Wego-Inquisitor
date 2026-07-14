import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { assignableRoles } from '../utils/roles.js';

/**
 * /give-rank @user <rank>
 *
 * The <rank> option uses autocomplete, so typing shows a suggestion box the
 * user navigates with the arrow keys. Suggestions come from the roles the bot
 * is allowed and able to assign (see utils/roles.js + ASSIGNABLE_RANKS).
 */
export default {
  data: new SlashCommandBuilder()
    .setName('give-rank')
    .setDescription('Give a rank/role to a member.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('The member to give the rank to.').setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('rank')
        .setDescription('Start typing to pick a rank.')
        .setRequired(true)
        .setAutocomplete(true),
    )
    // Only members who can manage roles see/use this by default.
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = assignableRoles(interaction.guild)
      .filter((role) => role.name.toLowerCase().includes(focused))
      .slice(0, 25) // Discord allows at most 25 suggestions.
      .map((role) => ({ name: role.name, value: role.id }));
    await interaction.respond(choices);
  },

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const rankValue = interaction.options.getString('rank', true);
    const guild = interaction.guild;

    // The autocomplete value is a role ID, but accept a name too in case the
    // user typed one manually.
    const role =
      guild.roles.cache.get(rankValue) ??
      assignableRoles(guild).find((r) => r.name.toLowerCase() === rankValue.toLowerCase());

    if (!role) {
      await interaction.reply({
        content: `❌ Couldn't find an assignable rank matching **${rankValue}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!assignableRoles(guild).some((r) => r.id === role.id)) {
      await interaction.reply({
        content: `❌ I can't assign **${role.name}** — it's above my highest role or not in the allowed list.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const member = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      await interaction.reply({
        content: `❌ **${targetUser.tag}** isn't a member of this server.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (member.roles.cache.has(role.id)) {
      await interaction.reply({
        content: `ℹ️ **${member.user.tag}** already has **${role.name}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await member.roles.add(role, `Granted via /give-rank by ${interaction.user.tag}`);
    await interaction.reply({
      content: `✅ Gave **${role.name}** to **${member.user.tag}**.`,
    });
  },
};
