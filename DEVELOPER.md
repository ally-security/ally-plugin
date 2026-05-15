# Developer Guide

Internal documentation for working on the Ally marketplace plugin. If
you're trying to **use** the plugin, see [`README.md`](README.md) instead.

> [!WARNING]
> **Experimental — work in progress.**
> Manifests, MCP endpoints, skills, and the multi-environment
> distribution model are all subject to change. See
> [`plan/environment-branches.md`](plan/environment-branches.md) for the
> in-flight multi-env design.

## Repository layout

This repo is a marketplace that ships a single plugin package used by
both Claude Code and Codex.

| Path                                          | Purpose |
| --------------------------------------------- | ------- |
| `plugins/ally/`                               | Canonical Ally plugin package. |
| `plugins/ally/.claude-plugin/plugin.json`     | Claude Code plugin manifest. |
| `plugins/ally/.codex-plugin/plugin.json`      | Codex plugin manifest. |
| `plugins/ally/.mcp.json`                      | Claude Code MCP server configuration. |
| `plugins/ally/.codex-mcp.json`                | Codex MCP server configuration. |
| `plugins/ally/skills/`                        | Reusable agent skills shipped with the plugin. |
| `plugins/ally/hooks/`                         | Lifecycle hooks and `hooks.json` config. |
| `plugins/ally/assets/`                        | Logos, favicons, screenshots, and other plugin assets. |
| `.claude-plugin/marketplace.json`             | Claude Code marketplace manifest. |
| `.agents/plugins/marketplace.json`            | Codex marketplace manifest. |
| `scripts/validate_plugin.py`                  | Local + CI validation. |
| `plan/`                                       | In-flight design docs. |

## MCP server

The plugin currently targets the Ally staging Streamable HTTP MCP server:

```text
https://api.staging.ally.security/mcp
```

Both `plugins/ally/.mcp.json` and `plugins/ally/.codex-mcp.json` point at
this URL. The transport field names differ slightly between Claude Code
and Codex, so keep the provider-specific shapes — don't try to unify
them into one file.

Production and local URLs are not yet wired up in the default manifests;
that's tracked in [`plan/environment-branches.md`](plan/environment-branches.md).

## Skills

Bundled skills live at:

- `plugins/ally/skills/tabletop/` — tabletop exercise planning and
  facilitation.
- `plugins/ally/skills/quest-scenario/` — quest-style incident scenario
  design.

Each skill includes:

- `SKILL.md` — the provider-readable skill entrypoint (YAML frontmatter
  with `name` + `description`, then markdown body).
- `files/` — supporting reference material the skill links to.
- `scripts/` — skill-specific helper scripts.

When editing a skill, keep the frontmatter intact — the validator will
reject malformed or empty `name` / `description` fields.

## Marketplace manifests

| Host          | File                                  |
| ------------- | ------------------------------------- |
| Claude Code   | `.claude-plugin/marketplace.json`     |
| Codex         | `.agents/plugins/marketplace.json`    |

Both manifests list a single plugin entry named `ally` that points at
`./plugins/ally`. The plugin `name` in both marketplace files must match
the `name` in both plugin manifests, or validation fails.

## Local install

### Claude Code

Point Claude Code at the plugin folder directly:

```bash
claude --plugin-dir ./plugins/ally
```

Or add this repo as a local marketplace and install from it:

```text
/plugin marketplace add ./path/to/ally-plugin
/plugin install ally@ally-marketplace
```

### Codex

Add this repo as a local Codex marketplace:

```bash
codex plugin marketplace add ./
```

Restart Codex and install **Ally** from the **Ally Plugins** marketplace.
Codex reads:

- `.agents/plugins/marketplace.json`
- `plugins/ally/.codex-plugin/plugin.json`
- `plugins/ally/.codex-mcp.json`
- `plugins/ally/skills/`
- `plugins/ally/hooks/hooks.json`

You can sandbox the Codex install against a throwaway `CODEX_HOME` so it
doesn't touch your real config:

```bash
mkdir -p /private/tmp/codex-plugin-test-home
env CODEX_HOME=/private/tmp/codex-plugin-test-home codex plugin marketplace add ./
```

## Validation

CI runs `scripts/validate_plugin.py`, which checks:

- JSON parsing for every manifest and MCP config.
- All required paths exist (`plugins/ally/.codex-plugin`,
  `plugins/ally/.claude-plugin`, `plugins/ally/hooks`,
  `plugins/ally/skills`, skill `files/` + `scripts/` folders, plugin
  assets, etc.).
- Codex and Claude plugin manifests carry matching `name`, required
  metadata, and valid relative paths for `skills`, `hooks`, and
  `mcpServers`.
- The Codex `interface` block has `displayName`, descriptions,
  capabilities, default prompts (≤3), icons, and policy URLs.
- The Codex marketplace entry uses a non-symlink local source that
  resolves to `./plugins/ally`.
- The Claude marketplace entry mirrors the same source path.
- MCP configs declare either a `url` (with optional `type: "http"`) or a
  `command`.
- Each `SKILL.md` starts with YAML frontmatter containing non-empty
  `name` and `description` fields and has a non-empty body.

Run the same validation locally:

```bash
python3 scripts/validate_plugin.py
```

If Claude Code is installed, you can also validate the Claude
marketplace directly:

```bash
claude plugin validate .
```

## Distribution / multi-environment

Distribution is git-native: users install via
`claude plugin marketplace add github:ally-security/ally-plugin` or the
Codex equivalent. There is no package registry.

The plan for supporting `local`, `staging`, and `prod` against the same
repo is documented in
[`plan/environment-branches.md`](plan/environment-branches.md).

## Pull requests

- Run `python3 scripts/validate_plugin.py` before opening a PR.
- Don't commit symlinks under `plugins/ally/` — the validator rejects
  them.
- Keep skill frontmatter and required asset paths in sync with the
  validator's `REQUIRED_PATHS` list.
- Update both `.mcp.json` and `.codex-mcp.json` together when changing
  MCP endpoints.
