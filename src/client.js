import { Client, GatewayIntentBits, Partials } from 'discord.js';

/**
 * Builds the discord.js client with exactly the intents this bot needs.
 *
 * GuildMembers is a *privileged* intent — enable "Server Members Intent" in
 * the Discord Developer Portal (Bot tab) or the client will fail to log in.
 * It's required to receive guildMemberAdd events.
 */
export function createClient() {
  return new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.GuildMember],
  });
}
