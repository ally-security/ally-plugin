# Ally plugin developer tasks.
# Run `just` (no args) to list recipes.

set shell := ["bash", "-cu"]

# Default Ally MCP URLs by environment.
staging_url := "https://api.staging.ally.security/mcp"
prod_url    := "https://api.ally.security/mcp"
local_url   := "http://localhost:8000/mcp/"

# List available recipes.
default:
    @just --list

# Run the local plugin validator (same checks CI runs).
validate:
    python3 scripts/validate_plugin.py

# Validate the Claude Code marketplace (requires Claude Code installed).
validate-claude:
    claude plugin validate .

# Run every validation we have.
check: validate validate-claude

# Launch Claude Code against the local plugin folder.
claude-local:
    claude --plugin-dir ./plugins/ally

# Add this repo as a local Codex marketplace.
codex-local:
    codex plugin marketplace add ./

# Same as `codex-local` but sandboxed in a throwaway CODEX_HOME.
codex-sandbox:
    mkdir -p /private/tmp/codex-plugin-test-home
    CODEX_HOME=/private/tmp/codex-plugin-test-home codex plugin marketplace add ./

# ---------------------------------------------------------------------------
# MCP Inspector — debug/inspect the Ally MCP server before shipping changes.
# Docs: https://github.com/modelcontextprotocol/inspector
#
# `just inspect`         -> staging (default)
# `just inspect-prod`    -> production
# `just inspect-local`   -> http://localhost:8000/mcp/
# `just inspect "<url>"` -> any custom URL
#
# The inspector launches a local web UI (typically at http://localhost:6274).
# Transport: pick **Streamable HTTP** and paste the URL printed below.
# ---------------------------------------------------------------------------

# Launch MCP Inspector. Defaults to the staging Ally MCP server.
inspect url=staging_url:
    @echo ""
    @echo "  MCP Inspector launching..."
    @echo "  Transport:  Streamable HTTP"
    @echo "  Server URL: {{url}}"
    @echo ""
    @echo "  When the UI opens, paste the URL above into the Server URL field"
    @echo "  and select 'Streamable HTTP' as the transport."
    @echo ""
    npx --yes @modelcontextprotocol/inspector

inspect-staging:
    @just inspect "{{staging_url}}"

inspect-prod:
    @just inspect "{{prod_url}}"

inspect-local:
    @just inspect "{{local_url}}"

# Print the URL each environment maps to.
envs:
    @echo "staging  -> {{staging_url}}"
    @echo "prod     -> {{prod_url}}"
    @echo "local    -> {{local_url}}"
