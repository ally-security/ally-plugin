---
name: ally-scenario-template
description: Author, inspect, create, edit, and locally validate Ally scenario-template drafts through the platform-admin MCP tools. Use when a permitted user wants a reusable global template, canonical scenario-template YAML, an ETag-safe template edit, a credible known-breach template, or diagnosis of template validation errors.
---

# Ally Scenario Template

Produce complete, credible schema-v2 template documents and manage unpublished
drafts without bypassing Ally's validation or optimistic concurrency.

## Tool Routing

Use these exact live tools when available to the authenticated user:

- `platform_admin_list_scenario_templates` — resolve IDs and compare existing
  templates.
- `platform_admin_get_scenario_template` — retrieve complete canonical YAML,
  metadata, and current ETag.
- `createScenarioTemplateDraft` — create one validated unpublished global draft
  from the complete document in the `yaml` argument.
- `editScenarioTemplateDraft` — replace the complete canonical document using
  `templateId`, `etag`, and `yaml`.

These tools require scenario-management access. Respect a missing tool or
permission error; do not attempt another admin endpoint as a workaround.

## Workflow

1. Determine whether the request is create, edit, review, or validation only.
   Do not change Ally data without an explicit write request.
2. Inspect the live tool schemas. For an edit, call
   `platform_admin_get_scenario_template` first and retain its `template_id`,
   `etag`, ownership, evidence notes, and complete YAML.
3. Collect the inputs in [references/inputs.md](references/inputs.md). Use
   `$ally-quest-scenario` to design or repair each nested scenario.
4. Build one complete schema-v2 authoring document. The current write boundary
   is global only: `ownership_scope: GLOBAL` and
   `customer_organization_id: null`.
5. For an edit, make the smallest requested content change while sending the
   complete replacement document. Ownership is immutable. Preserve IDs and
   fields outside the requested scope.
6. Save the exact document locally and validate it:

   ```bash
   node scripts/validate-scenario-template.mjs template.json --warnings-as-errors
   ```

   JSON is valid YAML 1.2, so a validated JSON document may be passed unchanged
   as the MCP `yaml` string. A `.yaml` file is also accepted by the script when
   the standard `yaml` Node package is installed.
7. Fix every error and resolve warnings. Then call `createScenarioTemplateDraft`
   or `editScenarioTemplateDraft` with the exact validated document text.
8. Retrieve the template again and verify its ID, status, source kind,
   canonical YAML, and new ETag. Never publish, archive, or delete unless the
   user separately requests an available lifecycle operation.

## Credibility Standard

Apply the quest-scenario credibility rules to every variant. Also:

- Ensure variants represent distinct genre/duration combinations and the
  representative scenario ID exists.
- Keep global playable fields organization-neutral. Preserve technical
  causality while removing victim names, brands, people, domains, exact record
  counts, and proprietary systems.
- For a real-breach template, read
  [references/evidence-guidance.md](references/evidence-guidance.md). Put
  curated admin-only research in `evidence_notes`; keep it separate from
  participant-facing content.
- For a fictional template, set real-breach fields to their empty values and do
  not imply historical provenance.
- Use official, current ATT&CK mappings only for behavior present in the
  scenario. The local validator checks format and consistency, not catalog
  freshness.

Read [references/authoring-contract.md](references/authoring-contract.md) for
the exact root document and template-specific constraints.
