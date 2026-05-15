# Ally Plugins

> [!WARNING]
> **Experimental — work in progress.**
> This marketplace is under active development. Endpoints, skills, and the
> multi-environment install flow are subject to change without notice. Do
> not rely on it for production workflows yet.

Bring Ally Security workflows — tabletop exercises, quest scenario design,
and incident-response analysis — straight into your AI coding agent.

This repository is a marketplace that ships one plugin, `ally`, for both
**Claude Code** and **Codex**. Installing it gives your agent:

- A connection to the Ally MCP server (read access to your organizations,
  tabletops, audit logs, and knowledge base).
- A set of bundled **skills** that teach the agent how to plan, review,
  and report on Ally exercises.

---

## What you get

| Skill                                                     | What it does |
| --------------------------------------------------------- | ------------ |
| [`tabletop`](plugins/ally/skills/tabletop/SKILL.md)       | Plan, prepare, review, and report on Ally tabletop exercises. Summarize sessions, extract follow-up actions, and audit completed exercises. |
| [`quest-scenario`](plugins/ally/skills/quest-scenario/SKILL.md) | Design and inspect quest-style incident scenarios — arcs, injects, roles, decision polls, media, and facilitator notes. |

Both skills are MCP-aware: when you're signed in, the agent can call into
Ally directly to fetch organizations, tabletops, quests, and supporting
context.

### Example prompts to try

- *"List my Ally organizations and available tabletops."*
- *"Summarize the most recent tabletop and extract follow-up actions."*
- *"Review this quest scenario for realism and flag any weak injects."*
- *"Build a tabletop facilitator brief for next week's exercise."*

---

## Install

### Claude Code

Add the marketplace and install the `ally` plugin:

```text
/plugin marketplace add ally-security/ally-plugin
/plugin install ally@ally-marketplace
```

```
claude plugin marketplace add ally-security/ally-plugin && claude plugin list && claude plugin install ally@ally-marketplace
```

Then restart Claude Code. You'll be prompted to authenticate with Ally on
first use.

### Codex

Add the marketplace from GitHub:

```bash
codex plugin marketplace add https://github.com/ally-security/ally-plugin
```

Restart Codex, open the **Ally Plugins** marketplace, and install
**Ally**. You'll be prompted to authenticate with Ally on install.

---

## Authentication

The plugin connects to Ally over MCP. You'll need an Ally account at
[ally.security](https://ally.security). The first time the agent uses an
Ally tool, it will walk you through sign-in.

---

## Environments

By default the plugin connects to Ally **staging**. Environment-specific
install refs (`@prod`, `@local`) are coming soon — see
[`plan/environment-branches.md`](plan/environment-branches.md) for the
proposed model.

---

## Support

- Website: [ally.security](https://ally.security)
- Docs: [docs.ally.security](https://docs.ally.security)
- Issues: [github.com/ally-security/ally-plugin/issues](https://github.com/ally-security/ally-plugin/issues)
- Contact: [support@ally.security](mailto:support@ally.security)

---

## Contributing / Local Development

Working on the plugin itself? See [`DEVELOPER.md`](DEVELOPER.md) for the
repository layout, manifest format, MCP configuration, validation, and
local-install instructions.

## License

MIT — see [`LICENSE`](LICENSE).
