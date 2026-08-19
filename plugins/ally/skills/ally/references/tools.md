# Ally MCP Tools

The hosted MCP implementation at `https://api.app.ally.security/mcp` exposes
the following core tools, plus four scenario-management tools for users with
that permission. Tool names are exact. Purpose summaries are routing guidance;
use the authenticated live tool description and input schema for parameters
and behavior.

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
- `createQuest` — reserved quest-creation write. Inspect the live schema and
  result before relying on it; the current server implementation may report
  that the operation is not implemented.
- `editQuest` — reserved quest-edit write. Call `getQuest` first, then inspect
  the live schema and result; do not assume it accepts scenario content or
  supports patch semantics.

## Scenario templates

- `listScenarioTemplates` — discover available scenario templates.
- `getScenarioTemplate` — retrieve one scenario template's available details.

### Scenario management

- `platform_admin_list_scenario_templates` — list complete admin template
  records and canonical YAML, including drafts, published templates, and
  archives. Supports live pagination and filters.
- `platform_admin_get_scenario_template` — retrieve one complete admin template
  by ID with canonical YAML, publication metadata, and ETag.
- `createScenarioTemplateDraft` — create a validated, unpublished global draft
  from a complete canonical YAML document. The source kind is MCP; this does
  not publish a revision.
- `editScenarioTemplateDraft` — replace a draft's complete canonical YAML using
  the current template ID and ETag. Fetch the template immediately before
  editing and handle conflicts by re-reading.

## History and knowledge

- `listAuditLogs` — retrieve audit history within the permitted scope.
- `listKnowledgebase` — retrieve available knowledge-base context.

## Selection rules

- Use a list tool to resolve IDs before calling the matching get tool.
- Resolve organization scope before organization-bound calls.
- Treat `createTabletopFromVideo`, `createQuest`, and `editQuest` as writes;
  call them only when the user requests the corresponding change.
- Treat `createScenarioTemplateDraft` and `editScenarioTemplateDraft` as writes.
  Use `$ally-scenario-template`, validate the complete document locally, and
  verify the result with `platform_admin_get_scenario_template`.
- Scenario-management tools are permission-gated. A missing tool or permission
  error is not authorization to use another admin path.
- Follow pagination in the live schema when the user needs a complete list.
- If the live `tools/list` response differs from this file, follow the live
  server and update this reference.
