# Ally Plugins

Marketplace package for exposing Ally tooling to Claude Code and Codex.

This repository is structured as a marketplace repo. The actual plugin package
lives once under `plugins/ally/` and is used by both Claude Code and Codex.

## Layout

- `plugins/ally/` - the canonical Ally plugin package.
- `plugins/ally/.claude-plugin/plugin.json` - Claude Code plugin manifest.
- `plugins/ally/.codex-plugin/plugin.json` - Codex plugin manifest.
- `plugins/ally/.mcp.json` - Claude Code MCP server configuration.
- `plugins/ally/.codex-mcp.json` - Codex plugin MCP server configuration.
- `plugins/ally/skills/` - reusable agent skills shipped with the plugin.
- `plugins/ally/hooks/` - optional lifecycle hooks and hook configuration.
- `plugins/ally/assets/` - logos, favicons, screenshots, and other plugin assets.
- `.claude-plugin/marketplace.json` - Claude Code marketplace manifest.
- `.agents/plugins/marketplace.json` - Codex marketplace manifest.
- `scripts/validate_plugin.py` - local and CI validation.

## MCP Server

The scaffold points at a local Streamable HTTP MCP server:

```text
http://localhost:8000/mcp/
```

Update `plugins/ally/.mcp.json` and `plugins/ally/.codex-mcp.json` when
the production Ally endpoint is ready. The transport field names differ by
host, so keep the provider-specific shapes.

## Skills

- `plugins/ally/skills/tabletop/` - tabletop exercise planning and facilitation.
- `plugins/ally/skills/quest-scenario/` - quest-style incident scenario design.

Each skill includes:

- `SKILL.md` - the provider-readable skill entrypoint.
- `files/` - supporting reference files.
- `scripts/` - skill-specific helper scripts.

## Local Install

### Claude Code

For local plugin-package testing, run Claude Code with the plugin directory:

```bash
claude --plugin-dir ./plugins/ally
```

For marketplace testing, add this repository and install `ally` from the
`ally-marketplace` catalog:

```text
/plugin marketplace add ./path/to/ally-plugin
/plugin install ally@ally-marketplace
```

### Codex

For local testing, add this repository as a Codex marketplace:

```bash
codex plugin marketplace add ./
```

Restart Codex and install `ally` from the `Ally Plugins`
marketplace. Codex reads `.agents/plugins/marketplace.json`,
`plugins/ally/.codex-plugin/plugin.json`,
`plugins/ally/.codex-mcp.json`, `plugins/ally/skills/`, and
`plugins/ally/hooks/hooks.json`.

## Marketplace

- Claude Code marketplace metadata lives in `.claude-plugin/marketplace.json`.
- Codex marketplace metadata lives in `.agents/plugins/marketplace.json`.

## Validation

CI validates JSON manifests, referenced paths, Claude and Codex marketplace
wiring, plugin metadata, required assets, MCP config shape, and skill
frontmatter.

Run the same validation locally:

```bash
python3 scripts/validate_plugin.py
```

You can also smoke-test that Codex accepts this repository as a local
marketplace without changing your real Codex configuration:

```bash
mkdir -p /private/tmp/codex-plugin-test-home
env CODEX_HOME=/private/tmp/codex-plugin-test-home codex plugin marketplace add ./
```

If Claude Code is installed, validate the Claude marketplace locally:

```bash
claude plugin validate .
```
