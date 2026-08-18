---
name: ally
description: Use Ally Security through its connected MCP server. Trigger for Ally account or authentication questions; discovering organizations and members; working with tabletops, quests, quest runs, scenario templates, audit logs, and knowledge-base data; creating tabletops from video; creating or editing quests; explaining Ally MCP capabilities; or troubleshooting Ally tool calls.
---

# Ally

Use the connected Ally MCP server as the source of truth. Prefer its tools over
assumptions about the user's Ally data or the server's current capabilities.

## Workflow

1. Inspect the available Ally MCP tools and use their current schemas. Tool
   names and capabilities may change independently of this skill.
2. Call `whoami` when identity, authentication, or account scope matters.
3. Resolve the organization before querying organization-scoped data. If the
   user has access to multiple plausible organizations, list them and ask which
   one they mean rather than guessing.
4. Use list tools to discover records and identifiers, then use the matching
   get tool when the request needs complete details.
5. Before a write, read the current record and check its state. Use the live
   input schema to determine whether the operation is a patch or full-object
   replacement; do not infer write semantics from the tool name.
6. After a write, retrieve the affected record when practical and report the
   resulting state.

## Tool Catalog

Read [references/tools.md](references/tools.md) when selecting a tool,
explaining Ally capabilities, or preparing a write. It records every tool name
advertised by the hosted MCP implementation.

Treat the catalog as routing guidance, not a substitute for `tools/list`. Read
the live tool description and input schema for required parameters,
pagination, write semantics, and state restrictions before calling a tool.

## Guardrails

- Ground answers in returned Ally data. Do not invent organizations,
  participants, findings, scenario content, statuses, or identifiers.
- Distinguish a request to explain or draft from a request to change Ally data.
  Perform writes only when the user asks for the change.
- Respect permission errors and lifecycle restrictions. Do not work around
  them; explain the limitation and the next available action.
- Preserve corrected or user-edited values when the server marks them as the
  current source of truth.
- Identify incomplete states such as processing or failed records instead of
  presenting them as final.
- Keep sensitive Ally data scoped to the user's request and avoid exposing raw
  payload fields that are not needed for the answer.

## Failure Handling

- If Ally tools are unavailable, explain that the plugin's MCP connection must
  be installed and authenticated before continuing.
- If authentication fails, ask the user to complete the host's Ally sign-in
  flow, then retry `whoami`.
- If a record is not found, verify the organization and identifier with list
  tools before concluding it does not exist.
- If a response is paginated or truncated, continue fetching pages when the
  user asked for a complete result.
