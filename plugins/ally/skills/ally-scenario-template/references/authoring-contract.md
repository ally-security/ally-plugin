# Scenario Template Authoring Contract

## Root document

Send one complete document in the MCP `yaml` string:

```yaml
schema_version: v2
ownership_scope: GLOBAL
customer_organization_id: null
evidence_notes: ""
content:
  difficulty: Medium
  inspired_by_real_breach: false
  real_breach_impacted_entities: []
  real_breach_references: []
  real_breach_summary: ""
  rehearsal_topics:
    - Practice incident declaration under uncertainty
    - Coordinate containment and continuity decisions
    - Rehearse stakeholder communications
  representative_scenario_id: scenario_example_operational_60
  scenarios: []
```

`scenarios` must contain 1-24 complete Quest scenarios. Consult
`$ally-quest-scenario` for their exact shape.

## Template constraints

- The document is YAML 1.2, at most 1 MiB, with one document only.
- Current schema version is exactly `v2`.
- MCP create/edit is global only and requires a null customer organization.
- `difficulty` is exactly `Easy`, `Medium`, or `Hard`.
- `representative_scenario_id` must match one scenario ID.
- Scenario IDs are unique case-insensitively.
- Each `genre_tag + duration_minutes` combination is unique.
- `genre_tag` is exactly `Technical`, `Operational`, `Comms Crisis`, or
  `Executive`.
- Template duration is an integer from 10 through 240 minutes.
- Scenario, inject, poll, and option IDs begin with a letter or number and use
  only letters, numbers, underscores, and hyphens.
- Inject timing uses `T+N min`, starts at zero, increases strictly, and remains
  within scenario duration.
- Counts equal their arrays; list values and IDs are unique in their scope.
- Poll impacts contain every Ally category exactly once and
  `biggest_impact` matches a highest-valued impact.
- Required scenario, inject, facilitator, media, and poll text is non-blank.

## Edit semantics

`editScenarioTemplateDraft` is a full replacement, not a patch. Always:

1. Get the latest template.
2. Edit its complete YAML locally.
3. Validate the complete result.
4. Send the current ETag.
5. On an ETag conflict, fetch again and reapply the requested change rather
   than overwriting the newer revision.

The write may update a draft or the pending linked revision of a published
template. It does not publish a revision.
