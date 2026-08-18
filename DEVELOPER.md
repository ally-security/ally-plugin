# Developer Guide

This repository publishes the Ally MCP plugin for Codex and Claude Code.

For normal installation, use [README.md](README.md).

## Repository layout

| Path | Purpose |
| --- | --- |
| `plugins/ally/.codex-plugin/plugin.json` | Codex plugin manifest. |
| `plugins/ally/.claude-plugin/plugin.json` | Claude Code plugin manifest. |
| `plugins/ally/.mcp.json` | Shared Codex and Claude Code MCP connection. |
| `plugins/ally/skills/ally/SKILL.md` | Instructions for using Ally through MCP. |
| `plugins/ally/skills/ally/references/tools.md` | Catalog of tools advertised by Ally. |
| `.agents/plugins/marketplace.json` | Codex marketplace manifest. |
| `.claude-plugin/marketplace.json` | Claude Code marketplace manifest. |

## MCP server

Both hosts connect to:

```text
https://api.app.ally.security/mcp
```

Both plugin manifests point to `plugins/ally/.mcp.json`, so the MCP URL has one
source of truth.

The public endpoint advertises the tool names. Authenticated MCP `tools/list`
is the source of truth for descriptions and input schemas. When tools change,
update `plugins/ally/skills/ally/references/tools.md`.

## Test locally

### Codex

Add this checkout as a marketplace and install the plugin:

```bash
codex plugin marketplace add ./
codex plugin add ally@ally-marketplace
```

Restart Codex, complete Ally sign-in, and test with:

> Use Ally to list my organizations.

### Claude Code

Launch directly from the plugin directory:

```bash
claude --plugin-dir ./plugins/ally
```

Or test the marketplace install flow:

```bash
claude plugin marketplace add ./
claude plugin install ally@ally-marketplace
```

Restart Claude Code, complete Ally sign-in, and use the same test prompt.

## Validate

Use the actual client CLIs. For Codex, add this checkout and install the plugin:

```bash
codex plugin marketplace add ./
codex plugin add ally@ally-marketplace
codex plugin list --json
```

For Claude Code, validate both manifests and install the plugin:

```bash
claude plugin validate ./plugins/ally
claude plugin validate .
claude plugin marketplace add ./
claude plugin install ally@ally-marketplace
claude plugin list --json
```

CI runs these flows with isolated client configuration directories. An install
failure is the validation failure; there is no separate repository validator.

## Inspect MCP tools

Launch MCP Inspector:

```bash
npx --yes @modelcontextprotocol/inspector
```

In MCP Inspector:

1. Select **Streamable HTTP**.
2. Enter `https://api.app.ally.security/mcp`.
3. Connect and complete Ally authentication.
4. Open **Tools** and compare the result with
   `plugins/ally/skills/ally/references/tools.md`.

For staging, use `https://api.staging.ally.security/mcp`. For a local Ally MCP
server, use `http://localhost:8000/mcp/`.

## Common commands

| Command | Purpose |
| --- | --- |
| `claude plugin validate ./plugins/ally` | Validate the Claude plugin manifest. |
| `claude plugin validate .` | Validate the Claude marketplace. |
| `codex plugin marketplace add ./` | Add the local Codex marketplace. |
| `codex plugin add ally@ally-marketplace` | Install Ally from that marketplace. |
| `codex plugin list --json` | Confirm the installed Codex plugin. |
| `claude plugin marketplace add ./` | Add the local Claude marketplace. |
| `claude plugin install ally@ally-marketplace` | Install Ally from that marketplace. |
| `claude --plugin-dir ./plugins/ally` | Launch Claude Code with the local plugin. |
| `npx --yes @modelcontextprotocol/inspector` | Launch MCP Inspector. |

## Release checklist

1. Bump and align both plugin manifests and marketplace entry versions.
2. Keep the shared MCP configuration on the intended URL.
3. Verify the live MCP tool list and update the skill catalog if necessary.
4. Run both real-client validation and install flows.
5. Confirm both install flows from [README.md](README.md).

The future environment-branch proposal is tracked in
[plan/environment-branches.md](plan/environment-branches.md).
