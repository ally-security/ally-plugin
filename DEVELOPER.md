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
| `justfile`                                    | Common developer tasks (`just --list`). |
| `plan/`                                       | In-flight design docs. |

## Prerequisites

| Tool                          | Why                                                    | Install |
| ----------------------------- | ------------------------------------------------------ | ------- |
| `python3`                     | Run the validator.                                     | preinstalled on macOS / `brew install python` |
| [`just`](https://just.systems) | Task runner (`justfile`).                              | `brew install just` |
| `node` + `npx`                | Run MCP Inspector via `npx`.                           | `brew install node` |
| `claude` CLI (optional)       | Local Claude Code testing + `claude plugin validate`.  | See Claude Code docs |
| `codex` CLI (optional)        | Local Codex marketplace testing.                       | See Codex docs |

## Common tasks (justfile)

The `justfile` wraps everything below. Run `just` (no args) to list
recipes. Highlights:

| Recipe                       | What it does |
| ---------------------------- | ------------ |
| `just validate`              | Run the Python plugin validator. |
| `just validate-claude`       | Run `claude plugin validate .` (requires Claude CLI). |
| `just check`                 | Run all validators in sequence. |
| `just claude-local`          | Launch Claude Code against `./plugins/ally`. |
| `just codex-local`           | Add this repo as a local Codex marketplace. |
| `just codex-sandbox`         | Same as `codex-local`, isolated in a throwaway `CODEX_HOME`. |
| `just inspect [url]`         | Launch MCP Inspector (defaults to staging). |
| `just inspect-staging`       | Inspector against staging Ally MCP. |
| `just inspect-prod`          | Inspector against prod Ally MCP. |
| `just inspect-local`         | Inspector against `http://localhost:8000/mcp/`. |
| `just envs`                  | Print the URL each environment maps to. |

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

## Inspecting the MCP server with MCP Inspector

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the
official debugging tool for Model Context Protocol servers. Use it to
verify that the Ally MCP endpoint actually responds, see which tools and
resources are exposed, and call tools by hand before shipping any plugin
or skill change that depends on them.

### Quick start

```bash
just inspect           # staging (default)
just inspect-prod      # production
just inspect-local     # http://localhost:8000/mcp/ (run the Ally MCP server locally first)
```

Or pass any URL explicitly:

```bash
just inspect "https://api.staging.ally.security/mcp"
```

Under the hood each recipe just runs:

```bash
npx --yes @modelcontextprotocol/inspector
```

### Using the UI

1. The recipe prints the **Server URL** and **Transport** to use, then
   spawns `npx @modelcontextprotocol/inspector`. The inspector opens a
   browser tab (typically at `http://localhost:6274`).
2. In the **Transport** dropdown pick **Streamable HTTP**.
3. Paste the printed Server URL into the **Server URL** field.
4. Click **Connect**. You'll be prompted to authenticate with Ally on
   first connect (the inspector handles the OAuth/token flow inline).
5. Once connected, browse:
   - **Tools** — call `whoami`, `list_organizations`, `list_tabletops`,
     `get_tabletop`, `list_auditlogs`, `list_knowledgebase`, etc. and
     inspect the raw JSON responses.
   - **Resources** — confirm any resources the server advertises.
   - **Prompts** — confirm any prompt templates exposed by the server.
6. Use the **History** pane to replay calls while iterating on a skill.

### When to run it

- Before bumping the MCP URL in `.mcp.json` / `.codex-mcp.json`.
- After any backend change that touches tool names, parameters, or
  return shapes — confirm the skills under `plugins/ally/skills/`
  reference accurate tool names and field paths.
- When debugging a failing tool call from inside Claude Code or Codex,
  to isolate "is the server broken?" from "is the plugin/skill wiring
  broken?".

### Inspector against a local Ally MCP server

If you're developing the Ally MCP server locally:

```bash
just inspect-local
```

This points the inspector at `http://localhost:8000/mcp/`, matching the
URL the proposed `local` environment branch will ship (see
[`plan/environment-branches.md`](plan/environment-branches.md)). Start
the local Ally MCP server in another terminal first.

## Distribution / multi-environment

Distribution is git-native: users install via
`claude plugin marketplace add github:ally-security/ally-plugin` or the
Codex equivalent. There is no package registry.

The plan for supporting `local`, `staging`, and `prod` against the same
repo is documented in
[`plan/environment-branches.md`](plan/environment-branches.md).

## Pull requests

- Run `just check` (or `python3 scripts/validate_plugin.py`) before
  opening a PR.
- If your change touches MCP wiring, run `just inspect` against staging
  to confirm the server still responds with the tools/resources your
  skill expects.
- Don't commit symlinks under `plugins/ally/` — the validator rejects
  them.
- Keep skill frontmatter and required asset paths in sync with the
  validator's `REQUIRED_PATHS` list.
- Update both `.mcp.json` and `.codex-mcp.json` together when changing
  MCP endpoints.
