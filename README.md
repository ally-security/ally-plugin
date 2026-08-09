# Ally MCP Plugin

Connect Codex or Claude Code to Ally Security.

You need an [Ally Security](https://ally.security) account to sign in.

## Install in Codex

Run these commands:

```bash
codex plugin marketplace add ally-security/ally-plugin
codex plugin add ally@ally-marketplace
```

Restart Codex. When prompted, sign in to Ally.

Test the connection with:

> Use Ally to list my organizations.

## Install in Claude Code

Run these commands:

```bash
claude plugin marketplace add ally-security/ally-plugin
claude plugin install ally@ally-marketplace
```

Restart Claude Code. When prompted, sign in to Ally.

Test the connection with:

> Use Ally to list my organizations.

## MCP endpoint

The plugin connects to:

```text
https://api.app.ally.security/mcp
```
