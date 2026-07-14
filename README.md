# Wego Inquisitor 🕵️

A robust, extensible Discord bot for the Wego server.

**What it does**

- **Delayed "New Wegos" role.** New members do *not* get the role on join. Instead the bot grants it automatically **1 hour later** (configurable).
- **Muted until verified.** Until a member has the New Wegos role they can't send messages in any channel. Run `/setup` once and the bot enforces this itself.
- **Slash commands with suggestion boxes.** e.g. `/give-rank @user <rank>` — start typing the rank and pick it from an autocomplete list with the arrow keys.
- **Built to grow.** Commands and events are auto-loaded from folders, so adding a feature is dropping in one file.

---

## How the delay + mute works

1. Someone joins → the bot records them as *pending* (persisted to disk, so it survives restarts) and does **not** assign a role.
2. After the delay elapses, a background sweeper grants them the **New Wegos** role. Anyone whose hour passed while the bot was offline is caught on the next sweep after it comes back up.
3. `/setup` denies "send messages" to `@everyone` and allows it for **New Wegos** in every channel. Since pending members only hold `@everyone`, they stay muted until step 2.

---

## Setup

### 1. Create the bot application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. **Bot** tab → copy the **token** (→ `DISCORD_TOKEN`).
3. On the same tab, enable **Server Members Intent** (required — the bot needs it to see members joining).
4. **General Information** → copy the **Application ID** (→ `CLIENT_ID`).
5. **Invite the bot** with the `bot` and `applications.commands` scopes and at least the **Manage Roles** and **Manage Channels** permissions. Make sure the bot's role sits **above** the "New Wegos" role in Server Settings → Roles, or it won't be able to assign it.

### 2. Configure

```bash
cp .env.example .env
# then edit .env
```

Key settings (all documented in `.env.example`):

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token |
| `CLIENT_ID` | Application ID |
| `GUILD_ID` | Your server ID — commands register here instantly |
| `NEW_WEGOS_ROLE_ID` / `NEW_WEGOS_ROLE_NAME` | The role to grant after the delay |
| `JOIN_ROLE_DELAY_MINUTES` | Delay before granting (default `60`) |
| `ASSIGNABLE_RANKS` | Ranks offered in `/give-rank` autocomplete |

> Enable **Developer Mode** in Discord (Settings → Advanced) to right-click and copy IDs.

### 3. Install, register commands, run

```bash
npm install
npm run deploy   # registers the slash commands with Discord
npm start        # starts the bot
```

Use `npm run dev` for auto-restart while developing.

### 4. In your server

Run `/setup` once (as an admin) to lock every channel so only New Wegos and above can talk.

---

## Commands

| Command | Who | What |
|---|---|---|
| `/give-rank @user <rank>` | Manage Roles | Grant a rank; the `<rank>` field autocompletes from allowed ranks |
| `/setup` | Administrator | Mute `@everyone`, let New Wegos talk, across all channels |
| `/ping` | Everyone | Health check |

---

## Extending it

The project is structured so features are additive:

```
src/
├── index.js              # entry point — wires everything together
├── client.js             # client + gateway intents
├── config.js             # all settings, validated once
├── logger.js             # leveled logger
├── commands/             # one file per slash command (auto-loaded)
│   ├── give-rank.js
│   ├── setup.js
│   └── ping.js
├── events/               # one file per gateway event (auto-loaded)
│   ├── ready.js
│   ├── guildMemberAdd.js
│   └── interactionCreate.js
├── handlers/             # command + event auto-loaders
├── scheduler/            # background jobs (the delayed-role sweeper)
├── store/                # persistence (atomic JSON, swappable for a DB)
└── utils/                # shared helpers (role resolution)
```

**Add a command:** create `src/commands/my-command.js` exporting `data` (a `SlashCommandBuilder`) and `execute(interaction)` — plus optional `autocomplete(interaction)` for a suggestion box. Run `npm run deploy`. Done.

**Add an event:** create `src/events/myEvent.js` exporting `name` (a `discord.js` `Events` value), optional `once`, and `execute(...args, client)`. It's registered on next start.

**Swap the storage:** `store/jsonStore.js` is a small interface (`get/set/delete/values`). Replace its internals with SQLite/Redis without touching callers.
