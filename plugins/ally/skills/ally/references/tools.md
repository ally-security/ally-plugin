# Ally MCP Tools

This catalog covers the current Ally MCP tool definitions. The hosted endpoint
is `https://api.app.ally.security/mcp`. Discovery filters privileged tools by
the caller's permissions, and deployments can differ from this catalog. Use
the authenticated live description and input schema for parameters and behavior.

## Identity and organizations

- `whoami` — inspect the authenticated Ally identity and account context.
- `listOrganizations` — discover accessible organizations and their IDs.
- `listMembers` — list members in the scope required by the live schema.

## Tabletops

- `listTabletops` — browse tabletop reports. The widget supports pagination and
  opens a report when the user selects it.
- `getTabletop` — open a tabletop report. Requires report-read permission.
- `getTabletopMedia` — widget-only tool for the report’s Recording and
  Transcript tabs. Requires report-media read permission.
- `getTabletopUploadStatus` — check transcription and report generation for
  an uploaded video. Find the upload by exact title or meeting ID.
- `createTabletopFromVideo` — start the supported tabletop-from-video
  creation workflow and open the upload status widget in a compatible host.
  Confirm the organization and video input before calling.

### Report corrections

- `getUpdateTabletopReportContext` — retrieve current content, revision,
  typed edit targets, tagging references, and allowed commands. Requires
  report-edit permission.
- `updateTabletopReport` — apply one typed edit or an atomic batch of 1-100
  edits using the current expected revision.
- `revertTabletopSectionToOriginal` — restore one section to its generated
  original while preserving other corrections.
- `revertTabletopToOriginal` — remove all report corrections and restore the
  generated report. Recording and processing state remain unchanged.

Read [report-editing.md](report-editing.md) before a report write.

## Quests

- `listQuests` — discover quests.
- `getQuest` — view a saved Quest, including its selected scenario,
  objectives, participant roles, and exercise sequence. Requires Quest read
  permission.
- `listQuestRuns` — list historical start occurrences, including repeated
  starts of one quest. Defaults to live runs; request dry runs or all modes
  explicitly. Use total and date filters to count sessions, not quest count.
- `createQuest` — reserved write; the current implementation returns
  `notImplemented` and does not create a quest.
- `editQuest` — reserved write; the current implementation returns
  `notImplemented` and does not save scenario JSON or edit a quest.

Inspect live schemas for future support. Until then, deliver a validated local
scenario or use the template-draft tools for a requested reusable global draft.

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
- `listKnowledgebase` — list file records; excludes organization-profile
  documents. This is not a file-content retrieval tool.

## Incident articles (platform admins)

- `list_incident_articles` — list articles with search, status filters, and
  pagination.
- `get_incident_article` — retrieve complete Markdown/MDX, frontmatter, and
  the current SHA.
- `edit_incident_article` — replace complete source using `expectedSha`.
  Editing published content triggers the automatic site build; changing its
  status to draft unpublishes it. Editing is production-only.

Read [incident-articles.md](incident-articles.md) before editing.

## Platform administration

- `platform_admin_get_overview` — retrieve platform-wide dashboard counts.
- `platform_admin_list_orgs` — search and filter customer/client organizations
  with sorting and pagination.
- `platform_admin_get_org` — retrieve an organization with independently
  paginated members, invitations, clients, meetings, tabletops, and quests.
- `platform_admin_get_org_notifications` — inspect organization notification
  delivery records with filters and pagination.
- `platform_admin_get_org_auditlogs` — inspect organization audit history.
- `platform_admin_get_users` — search and paginate platform users.
- `platform_admin_get_user` — retrieve a user's platform details.
- `platform_admin_get_user_notifications` — inspect user notification delivery
  records.
- `platform_admin_get_user_auditlogs` — inspect user audit history.
- `platform_admin_get_auditlogs` — query platform-wide audit records.
- `platform_admin_create_customer_org` — create a customer organization and
  start its organization-profile build.
- `platform_admin_invite_org_members` — send invitations with explicit roles;
  optionally propagate view-only invitations to clients.
- `platform_admin_add_org_member` — add an existing user directly with an
  explicit organization and role.

These tools require platform-admin access. Use targeted organization/user
queries for support investigations and retrieve only the records needed for
the request. Before membership writes, resolve existing users, memberships,
and pending invitations. Invitations send email: perform them only when the
user explicitly requests invitations. Do not substitute direct membership for
an invitation or use admin tools to work around customer permission errors.

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
