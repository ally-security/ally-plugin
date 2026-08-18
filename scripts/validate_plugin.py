#!/usr/bin/env python3
"""Validate the Ally plugin manifests and local plugin assets."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_MCP_URL = "https://api.app.ally.security/mcp"

JSON_FILES = [
    ".claude-plugin/marketplace.json",
    ".agents/plugins/marketplace.json",
    "plugins/ally/.codex-plugin/plugin.json",
    "plugins/ally/.claude-plugin/plugin.json",
    "plugins/ally/.mcp.json",
    "plugins/ally/hooks/hooks.json",
]

REQUIRED_PATHS = [
    "plugins/ally/.codex-plugin",
    "plugins/ally/.claude-plugin",
    "plugins/ally/skills/ally/SKILL.md",
    "plugins/ally/skills/ally/agents/openai.yaml",
    "plugins/ally/skills/ally/references/tools.md",
    "plugins/ally/hooks",
    "scripts",
    "plugins/ally/assets",
    "plugins/ally/assets/icon.svg",
    "plugins/ally/assets/favicon.png",
    "plugins/ally/assets/logo.png",
]


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_json(relative_path: str) -> Any:
    path = ROOT / relative_path
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        fail(f"missing JSON file: {relative_path}")
    except json.JSONDecodeError as error:
        fail(f"invalid JSON in {relative_path}: {error}")


def require_object(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{label} must be a JSON object")
    return value


def require_string(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{label} must be a non-empty string")
    return value


def require_string_list(value: Any, label: str, *, min_items: int = 1, max_items: int | None = None) -> list[str]:
    if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
        fail(f"{label} must be a list of non-empty strings")
    if len(value) < min_items:
        fail(f"{label} must contain at least {min_items} item(s)")
    if max_items is not None and len(value) > max_items:
        fail(f"{label} must contain no more than {max_items} item(s)")
    return value


def require_relative_path(value: Any, label: str) -> Path:
    raw_path = require_string(value, label)
    if not raw_path.startswith("./"):
        fail(f"{label} must be a relative path beginning with ./")
    return ROOT / raw_path[2:]


def validate_codex_manifest(plugin_path: Path) -> dict[str, Any]:
    manifest_path = plugin_path / ".codex-plugin" / "plugin.json"
    manifest = require_object(json.loads(manifest_path.read_text(encoding="utf-8")), str(manifest_path.relative_to(ROOT)))

    allowed_keys = {
        "id",
        "name",
        "version",
        "description",
        "skills",
        "apps",
        "mcpServers",
        "interface",
        "author",
        "homepage",
        "repository",
        "license",
        "keywords",
    }
    unsupported_keys = sorted(set(manifest) - allowed_keys)
    if unsupported_keys:
        fail(f"Codex plugin manifest contains unsupported keys: {', '.join(unsupported_keys)}")

    name = require_string(manifest.get("name"), "plugin name")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", name):
        fail("plugin name must be kebab-case, lowercase, and no more than 64 characters")

    require_string(manifest.get("version"), "plugin version")
    require_string(manifest.get("description"), "plugin description")
    require_string(manifest.get("homepage"), "plugin homepage")
    require_string(manifest.get("repository"), "plugin repository")
    require_string(manifest.get("license"), "plugin license")
    require_string_list(manifest.get("keywords"), "plugin keywords", min_items=5)

    author = require_object(manifest.get("author"), "plugin author")
    require_string(author.get("name"), "plugin author.name")
    require_string(author.get("url"), "plugin author.url")

    for key in ("skills", "mcpServers"):
        path = require_relative_path(manifest.get(key), f"plugin {key}")
        path = plugin_path / path.relative_to(ROOT)
        if not path.exists():
            fail(f"plugin {key} target does not exist: {manifest[key]}")
    if manifest.get("mcpServers") != "./.mcp.json":
        fail("plugin mcpServers must point to ./.mcp.json")

    interface = require_object(manifest.get("interface"), "plugin interface")
    for key in ("displayName", "shortDescription", "longDescription", "developerName", "category"):
        require_string(interface.get(key), f"interface.{key}")

    require_string(interface.get("websiteURL"), "interface.websiteURL")
    require_string(interface.get("privacyPolicyURL"), "interface.privacyPolicyURL")
    require_string(interface.get("termsOfServiceURL"), "interface.termsOfServiceURL")
    require_string_list(interface.get("capabilities"), "interface.capabilities")
    require_string_list(interface.get("defaultPrompt"), "interface.defaultPrompt", max_items=3)

    for key in ("composerIcon", "logo"):
        path = require_relative_path(interface.get(key), f"interface.{key}")
        path = plugin_path / path.relative_to(ROOT)
        if not path.is_file():
            fail(f"interface.{key} target does not exist: {interface[key]}")

    return manifest


def validate_claude_manifest(plugin_path: Path, plugin_name: str, plugin_version: str) -> None:
    manifest_path = plugin_path / ".claude-plugin" / "plugin.json"
    manifest = require_object(json.loads(manifest_path.read_text(encoding="utf-8")), str(manifest_path.relative_to(ROOT)))

    allowed_keys = {
        "name",
        "version",
        "description",
        "author",
        "homepage",
        "repository",
        "license",
        "keywords",
        "commands",
        "agents",
        "skills",
        "hooks",
        "mcpServers",
        "lspServers",
        "outputStyles",
    }
    unsupported_keys = sorted(set(manifest) - allowed_keys)
    if unsupported_keys:
        fail(f"Claude plugin manifest contains unsupported keys: {', '.join(unsupported_keys)}")

    if manifest.get("name") != plugin_name:
        fail("Claude plugin manifest name must match the Codex plugin name")

    claude_version = require_string(manifest.get("version"), "Claude plugin version")
    if claude_version != plugin_version:
        fail("Claude plugin version must match the Codex plugin version")
    require_string(manifest.get("description"), "Claude plugin description")
    require_string(manifest.get("homepage"), "Claude plugin homepage")
    require_string(manifest.get("repository"), "Claude plugin repository")
    require_string(manifest.get("license"), "Claude plugin license")
    require_string_list(manifest.get("keywords"), "Claude plugin keywords", min_items=5)
    author = require_object(manifest.get("author"), "Claude plugin author")
    require_string(author.get("name"), "Claude plugin author.name")
    require_string(author.get("url"), "Claude plugin author.url")

    for key in ("skills", "mcpServers"):
        path = plugin_path / require_relative_path(manifest.get(key), f"Claude plugin {key}").relative_to(ROOT)
        if not path.exists():
            fail(f"Claude plugin {key} target does not exist: {manifest[key]}")
    if manifest.get("mcpServers") != "./.mcp.json":
        fail("Claude plugin mcpServers must point to ./.mcp.json")


def validate_mcp_config(relative_path: str) -> None:
    payload = require_object(load_json(relative_path), relative_path)
    servers = payload.get("mcpServers")
    if not isinstance(servers, dict) or not servers:
        fail(f"{relative_path} must contain a non-empty mcpServers object")

    for name, config in servers.items():
        if not isinstance(name, str) or not name.strip():
            fail(f"{relative_path} contains an invalid MCP server name")
        config = require_object(config, f"{relative_path}.mcpServers.{name}")

        if "url" in config:
            require_string(config.get("url"), f"{relative_path}.mcpServers.{name}.url")
            config_type = config.get("type")
            if config_type is not None and config_type != "http":
                fail(f"{relative_path}.mcpServers.{name}.type must be http when present")
        elif "command" in config:
            require_string(config.get("command"), f"{relative_path}.mcpServers.{name}.command")
        else:
            fail(f"{relative_path}.mcpServers.{name} must define either url or command")

    ally_config = require_object(servers.get("mcp-ally"), f"{relative_path}.mcpServers.mcp-ally")
    if ally_config.get("url") != EXPECTED_MCP_URL:
        fail(f"{relative_path} must point mcp-ally at {EXPECTED_MCP_URL}")


def validate_codex_marketplace(plugin_name: str) -> Path:
    marketplace = require_object(load_json(".agents/plugins/marketplace.json"), "marketplace")
    require_string(marketplace.get("name"), "marketplace name")
    interface = require_object(marketplace.get("interface"), "marketplace interface")
    require_string(interface.get("displayName"), "marketplace interface.displayName")
    require_string(interface.get("description"), "marketplace interface.description")
    require_string(interface.get("websiteURL"), "marketplace interface.websiteURL")

    plugins = marketplace.get("plugins")
    if not isinstance(plugins, list) or not plugins:
        fail("marketplace.plugins must be a non-empty array")

    matching = [entry for entry in plugins if isinstance(entry, dict) and entry.get("name") == plugin_name]
    if len(matching) != 1:
        fail(f"marketplace must contain exactly one entry for {plugin_name}")

    entry = matching[0]
    source = require_object(entry.get("source"), f"marketplace entry {plugin_name}.source")
    if source.get("source") != "local":
        fail(f"marketplace entry {plugin_name}.source.source must be local")

    plugin_path = require_relative_path(source.get("path"), f"marketplace entry {plugin_name}.source.path")
    expected_path = Path("plugins") / plugin_name
    if plugin_path.resolve() != (ROOT / expected_path).resolve():
        fail(f"marketplace entry {plugin_name}.source.path must resolve to ./{expected_path}")
    if plugin_path.is_symlink():
        fail(f"marketplace entry {plugin_name}.source.path must not be a symlink")

    plugin_manifest = plugin_path / ".codex-plugin" / "plugin.json"
    if not plugin_manifest.is_file():
        fail(f"marketplace entry {plugin_name} does not resolve to a plugin manifest")
    for required_child in (".codex-plugin", "skills", "hooks", "assets"):
        child = plugin_path / required_child
        if child.is_symlink():
            fail(f"marketplace plugin child must be a real file or directory, not a symlink: {child.relative_to(ROOT)}")
        if not child.exists():
            fail(f"marketplace plugin child is missing: {child.relative_to(ROOT)}")

    resolved_manifest = require_object(json.loads(plugin_manifest.read_text(encoding="utf-8")), str(plugin_manifest))
    if resolved_manifest.get("name") != plugin_name:
        fail(f"marketplace entry {plugin_name} does not match resolved plugin manifest name")
    if entry.get("version") != resolved_manifest.get("version"):
        fail(f"marketplace entry {plugin_name} version must match the plugin manifest")

    policy = require_object(entry.get("policy"), f"marketplace entry {plugin_name}.policy")
    if policy.get("installation") not in {"NOT_AVAILABLE", "AVAILABLE", "INSTALLED_BY_DEFAULT"}:
        fail(f"marketplace entry {plugin_name}.policy.installation has an invalid value")
    if policy.get("authentication") not in {"ON_INSTALL", "ON_USE"}:
        fail(f"marketplace entry {plugin_name}.policy.authentication has an invalid value")
    require_string(entry.get("category"), f"marketplace entry {plugin_name}.category")
    require_string(entry.get("description"), f"marketplace entry {plugin_name}.description")
    require_string_list(entry.get("tags"), f"marketplace entry {plugin_name}.tags", min_items=3)
    return plugin_path


def validate_claude_marketplace(plugin_name: str, plugin_path: Path) -> None:
    marketplace = require_object(load_json(".claude-plugin/marketplace.json"), "Claude marketplace")
    require_string(marketplace.get("name"), "Claude marketplace name")
    require_string(marketplace.get("description"), "Claude marketplace description")
    owner = require_object(marketplace.get("owner"), "Claude marketplace owner")
    require_string(owner.get("name"), "Claude marketplace owner.name")

    plugins = marketplace.get("plugins")
    if not isinstance(plugins, list) or not plugins:
        fail("Claude marketplace.plugins must be a non-empty array")

    matching = [entry for entry in plugins if isinstance(entry, dict) and entry.get("name") == plugin_name]
    if len(matching) != 1:
        fail(f"Claude marketplace must contain exactly one entry for {plugin_name}")

    source = matching[0].get("source")
    if source != f"./plugins/{plugin_name}":
        fail(f"Claude marketplace source for {plugin_name} must be ./plugins/{plugin_name}")
    if (ROOT / source[2:]).resolve() != plugin_path.resolve():
        fail(f"Claude marketplace source for {plugin_name} does not match Codex plugin path")
    require_string(matching[0].get("description"), f"Claude marketplace plugin {plugin_name}.description")
    plugin_manifest = require_object(
        json.loads((plugin_path / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8")),
        "Claude plugin manifest",
    )
    if matching[0].get("version") != plugin_manifest.get("version"):
        fail(f"Claude marketplace plugin {plugin_name} version must match the plugin manifest")
    require_string(matching[0].get("category"), f"Claude marketplace plugin {plugin_name}.category")
    require_string_list(matching[0].get("tags"), f"Claude marketplace plugin {plugin_name}.tags", min_items=3)


def validate_skill(relative_path: str) -> None:
    path = ROOT / relative_path
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        fail(f"{relative_path} must start with YAML frontmatter")

    try:
        _, frontmatter, body = text.split("---", 2)
    except ValueError:
        fail(f"{relative_path} has unterminated frontmatter")

    fields: dict[str, str] = {}
    for line in frontmatter.strip().splitlines():
        if ":" not in line:
            fail(f"{relative_path} frontmatter contains an invalid line: {line}")
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip()

    for key in ("name", "description"):
        require_string(fields.get(key), f"{relative_path} frontmatter {key}")

    if fields["name"] != "ally":
        fail(f"{relative_path} frontmatter name must be ally")
    if not body.strip():
        fail(f"{relative_path} must contain skill instructions after frontmatter")


def validate_required_paths() -> None:
    for relative_path in REQUIRED_PATHS:
        if not (ROOT / relative_path).exists():
            fail(f"missing required path: {relative_path}")


def main() -> int:
    for json_file in JSON_FILES:
        load_json(json_file)

    validate_required_paths()
    plugin_path = ROOT / "plugins" / "ally"
    manifest = validate_codex_manifest(plugin_path)
    plugin_path = validate_codex_marketplace(manifest["name"])
    validate_claude_manifest(plugin_path, manifest["name"], manifest["version"])
    validate_claude_marketplace(manifest["name"], plugin_path)
    validate_mcp_config("plugins/ally/.mcp.json")
    validate_skill("plugins/ally/skills/ally/SKILL.md")

    print("Plugin validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
