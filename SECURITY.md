# Security Policy

## Reporting a vulnerability

If you find a security issue in Wego Inquisitor, please report it privately
rather than opening a public issue:

- Use GitHub's **[Report a vulnerability](https://github.com/QuirijnPolinoco/Wego-Inquisitor/security/advisories/new)**
  (Security → Advisories) to open a private advisory.

Please include steps to reproduce and the potential impact. We'll acknowledge
your report and work on a fix before any public disclosure.

## Handling secrets

This is a public repository. Never commit real credentials:

- The bot token, application ID, and any server IDs live in a local `.env`
  file, which is git-ignored. Only `.env.example` (placeholders) is tracked.
- Runtime data under `data/` (which contains member IDs) is git-ignored.
- If a token is ever exposed, **regenerate it immediately** in the
  [Discord Developer Portal](https://discord.com/developers/applications)
  (Bot → Reset Token) — rotating the secret is the only reliable fix, since
  git history is public and permanent.

## Bot permissions

The bot requests only the intents and permissions it needs (Guilds +
Server Members intent; Manage Roles / Manage Channels). Grant it a role
positioned only as high as required to manage the roles it assigns.
