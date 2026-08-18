# Ally Plugin

Use Ally Security from Codex or Claude Code through MCP. The plugin provides
access to Ally organizations, tabletops, quests, scenario templates, audit
logs, and knowledge-base tools.

You need an [Ally Security](https://ally.security) account and either Codex or
Claude Code.

## Codex

Install the marketplace and plugin:

```bash
codex plugin marketplace add ally-security/ally-plugin
codex plugin add ally@ally-marketplace
```

Restart Codex, sign in to Ally when prompted, then try:

> Use Ally to list my organizations.

## Claude Code

Install the marketplace and plugin:

```bash
claude plugin marketplace add ally-security/ally-plugin
claude plugin install ally@ally-marketplace
```

Restart Claude Code, sign in to Ally when prompted, then try:

> Use Ally to list my organizations.

## Connection

Both clients connect to the hosted Ally MCP endpoint:

```text
https://api.app.ally.security/mcp
```

Authentication uses Ally's OAuth sign-in flow. No API key needs to be added to
this repository.
