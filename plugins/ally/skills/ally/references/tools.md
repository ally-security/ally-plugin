# Ally MCP Tools

The hosted MCP implementation at `https://api.app.ally.security/mcp`
advertised the following 15 tools on 2026-08-18. Tool names are exact. Purpose
summaries are routing guidance; use the authenticated live tool description and
input schema for parameters and behavior.

## Identity and organizations

- `whoami` — inspect the authenticated Ally identity and account context.
- `listOrganizations` — discover accessible organizations and their IDs.
- `listMembers` — list members in the scope required by the live schema.

## Tabletops

- `listTabletops` — discover tabletop exercises.
- `getTabletop` — retrieve one tabletop's complete available details.
- `createTabletopFromVideo` — start the supported tabletop-from-video
  creation workflow. Confirm the organization and video input before calling.

## Quests

- `listQuests` — discover quests.
- `getQuest` — retrieve one quest's complete available details and current
  state.
- `listQuestRuns` — list quest runs in the scope and shape defined by the live
  schema.
- `createQuest` — create a quest using the fields required by the live schema.
- `editQuest` — update a quest. Call `getQuest` first and use the live schema
  to determine patch versus replacement semantics and editable states.

## Scenario templates

- `listScenarioTemplates` — discover available scenario templates.
- `getScenarioTemplate` — retrieve one scenario template's available details.

## History and knowledge

- `listAuditLogs` — retrieve audit history within the permitted scope.
- `listKnowledgebase` — retrieve available knowledge-base context.

## Selection rules

- Use a list tool to resolve IDs before calling the matching get tool.
- Resolve organization scope before organization-bound calls.
- Treat `createTabletopFromVideo`, `createQuest`, and `editQuest` as writes;
  call them only when the user requests the corresponding change.
- Follow pagination in the live schema when the user needs a complete list.
- If the live `tools/list` response differs from this file, follow the live
  server and update this reference.
