# Environment Branches

> Status: proposed; not yet shipped.

The plugin currently connects to production from `main`:

```text
https://api.app.ally.security/mcp
```

If separate installable environments are needed, use thin Git branches that
change only the two MCP configuration files.

| Branch | MCP URL | Purpose |
| --- | --- | --- |
| `main` | `https://api.app.ally.security/mcp` | Production installs. |
| `staging` | `https://api.staging.ally.security/mcp` | Internal testing. |
| `local` | `http://localhost:8000/mcp/` | Local MCP development. |

## Proposed branch model

Keep all plugin manifests, skills, hooks, assets, and documentation on `main`.
Maintain `staging` and `local` as mechanical overlays containing only the URL
changes in:

- `plugins/ally/.codex-mcp.json`
- `plugins/ally/.mcp.json`

Rebase or regenerate both overlay branches whenever `main` changes, then run
`python3 scripts/validate_plugin.py` on every branch.

## Proposed install commands

Install one environment at a time because every branch uses the same
`ally-marketplace` name.

### Production

```bash
codex plugin marketplace add ally-security/ally-plugin
codex plugin add ally@ally-marketplace
```

```bash
claude plugin marketplace add ally-security/ally-plugin
claude plugin install ally@ally-marketplace
```

### Staging

```bash
codex plugin marketplace add ally-security/ally-plugin --ref staging
codex plugin add ally@ally-marketplace
```

```bash
claude plugin marketplace add ally-security/ally-plugin@staging
claude plugin install ally@ally-marketplace
```

### Local

```bash
codex plugin marketplace add ally-security/ally-plugin --ref local
codex plugin add ally@ally-marketplace
```

```bash
claude plugin marketplace add ally-security/ally-plugin@local
claude plugin install ally@ally-marketplace
```

## Before implementation

1. Confirm both hosts resolve Git refs consistently.
2. Add an automated branch-sync workflow using force-with-lease.
3. Test authentication and tool discovery in each environment.
4. Document how to switch or remove an existing marketplace safely.
5. Keep environment-specific credentials out of the repository.
