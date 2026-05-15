# Multi-Environment Distribution via Git Branches

> Status: **Experimental / in the works.** This plan is a proposal for how the
> Ally plugin marketplace will support testing against local, staging, and
> production environments while keeping the existing git-based distribution
> mechanism intact. Nothing here is shipped yet.

## Goal

Allow developers and customers to install the **same** Ally plugin package
against any of three Ally backends without forking the repository, breaking
the marketplace install flow, or maintaining three near-duplicate codebases.

| Environment | MCP URL                                      | Audience              |
| ----------- | -------------------------------------------- | --------------------- |
| `local`     | `http://localhost:8000/mcp/`                 | Plugin developers     |
| `staging`   | `https://api.staging.ally.security/mcp`      | Internal QA / dogfood |
| `prod`      | `https://api.ally.security/mcp`              | Customers             |

## Constraints

- Distribution is git-native. Users run
  `claude plugin marketplace add github:ally-security/ally-plugin` or the
  Codex equivalent. No package registry, no install-time prompts.
- `scripts/validate_plugin.py` requires a single plugin folder at
  `plugins/ally/`, enforces a single `.mcp.json` / `.codex-mcp.json`, and
  rejects symlinks for plugin children.
- Skills, hooks, and assets must stay in lockstep across environments;
  only the MCP endpoint differs.
- The marketplace JSON manifests must continue to validate on every ref.

## Approach: Environment Branches

Keep one source of truth on `main`. Maintain two thin overlay branches
(`prod` and `local`) that differ from `main` by exactly one commit which
rewrites the MCP URLs.

```
main      o---o---o---o---o          (staging URL; canonical work happens here)
                         \
prod                      o          (one commit: swap MCP URL -> prod)
                         \
local                     o          (one commit: swap MCP URL -> localhost)
```

`main` is staging by default. `prod` and `local` are mechanical overlays
maintained by a sync script so the env-override commit is always replayed
on top of the latest `main`.

### Install commands

```bash
# Claude Code
claude plugin marketplace add github:ally-security/ally-plugin            # = main = staging
claude plugin marketplace add github:ally-security/ally-plugin@prod
claude plugin marketplace add github:ally-security/ally-plugin@local

# Codex
codex plugin marketplace add github:ally-security/ally-plugin
codex plugin marketplace add github:ally-security/ally-plugin@prod
codex plugin marketplace add github:ally-security/ally-plugin@local
```

Tags (`v0.1.0-prod`, `v0.1.0-local`, etc.) can be cut on top of each branch
for reproducible installs.

### Why this works

- **Single source of truth.** All skill, hook, and asset changes land on
  `main`. The other branches never accept direct edits; they are mechanical
  rebases.
- **No repo bloat.** Each non-main branch only diverges by a one-file diff
  (the MCP config). No duplicated skills or assets.
- **No validator changes.** `scripts/validate_plugin.py` passes on every
  branch because the on-disk layout never changes.
- **Git-native distribution preserved.** Both Claude Code and Codex
  marketplace flows already understand `@ref` suffixes on git URLs.
- **Reversible.** If we ever want a different model, we just delete the
  overlay branches; nothing else in the repo has to change.

### Trade-offs

- A small sync script is required to keep `prod` and `local` in lockstep
  with `main`. We will automate this with GitHub Actions.
- Users must remember the right suffix. The README will document the three
  install commands.

## Implementation Plan

### 1. Add environment override commits

On `main`, create two stub branches off the current HEAD:

```bash
git checkout -b prod main
# edit plugins/ally/.mcp.json        -> https://api.ally.security/mcp
# edit plugins/ally/.codex-mcp.json  -> https://api.ally.security/mcp
git commit -am "env(prod): point MCP at production"
git push -u origin prod

git checkout -b local main
# edit plugins/ally/.mcp.json        -> http://localhost:8000/mcp/
# edit plugins/ally/.codex-mcp.json  -> http://localhost:8000/mcp/
git commit -am "env(local): point MCP at localhost"
git push -u origin local
```

The diff per overlay branch is exactly two files, two lines.

### 2. Capture the overlay commits

Save the SHAs of the override commits so the sync script can replay them:

```text
prod-overlay  -> <sha>
local-overlay -> <sha>
```

The sync script reads the most recent overlay commit on each branch and
cherry-picks it onto a freshly-reset branch from `main`.

### 3. Add `scripts/sync_envs.sh`

A small shell script that:

1. Fetches `origin`.
2. For each env in `prod local`:
   - Determines the overlay commit (the single commit between
     `merge-base(main, env)` and `env`).
   - Resets the local env branch to `origin/main`.
   - Cherry-picks the overlay commit.
   - Runs `python3 scripts/validate_plugin.py` to confirm the result still
     passes validation.
   - Force-pushes with `--force-with-lease`.
3. Returns to the original branch.

The script is safe to re-run; it never edits `main`.

### 4. Automate via GitHub Actions

Add `.github/workflows/sync-envs.yml` that runs `scripts/sync_envs.sh` on
every push to `main`. Required permissions: `contents: write`. The job
uses the default `GITHUB_TOKEN` and force-pushes `prod` and `local`.

Failure modes (e.g. cherry-pick conflicts) page the maintainer via the
Actions failure notification.

### 5. Document in README

Add an `## Environments` section to `README.md` that lists the three
install commands and explains which branch maps to which backend. Include
the experimental callout until this lands and is verified end-to-end.

### 6. Validate end-to-end

Smoke-test the three install paths against a temporary Claude Code and
Codex home directory:

```bash
# Staging (main)
claude plugin marketplace add github:ally-security/ally-plugin

# Prod
claude plugin marketplace add github:ally-security/ally-plugin@prod

# Local
claude plugin marketplace add github:ally-security/ally-plugin@local
```

Confirm the resolved `.mcp.json` inside each install points at the
expected URL.

## Out of Scope (for this plan)

- Per-environment auth tokens or secrets. The MCP config only carries a
  URL today; secrets handling is a separate workstream.
- A runtime env-var switch (e.g. an MCP launcher shim). Evaluated and
  rejected: it loses the native HTTP transport, adds a runtime dependency,
  and is harder to debug across hosts.
- Multiple plugin entries per marketplace (`ally`, `ally-staging`,
  `ally-local`). Evaluated and rejected: triplicates skills/hooks/assets
  and complicates the install UX.

## Open Questions

- Should `main` continue to default to **staging**, or should we flip it
  to **prod** and add a `staging` overlay branch instead? Current
  proposal: keep staging on `main` so unintended pushes from new
  contributors hit staging, not prod.
- Do we want signed tags per environment (`v0.1.0-prod`, etc.) for
  customer-facing pins? Recommended: yes, but tracked separately once the
  branch model is in place.
