# Scenario Template Inputs

## Required authoring decisions

- Create, edit, review, or validate only.
- Template purpose and target exercise outcome.
- Representative genre and duration.
- One or more complete scenario variants.
- Overall difficulty: `Easy`, `Medium`, or `Hard`.
- Whether the content is inspired by a real breach.
- For an edit: template ID, current ETag, current complete YAML, and exact
  requested changes.

Nested scenarios also require the inputs described by
`$ally-quest-scenario`: organization-independent context, roles, incident and
attack path, objectives, inject count, challenge level, source material,
constraints, and language.

## Ownership

The current MCP authoring boundary supports only:

```text
ownership_scope: GLOBAL
customer_organization_id: null
```

Do not silently convert a customer-owned document to global. Ownership is
immutable on edit.

## Real-breach metadata

When `inspired_by_real_breach` is true, collect:

- one to ten documented impacted entities
- two to five high-quality references for the authoring standard
- a two-to-four-sentence factual summary
- three to six rehearsal topics
- curated Markdown research/evidence notes

When false, use empty impacted entities, references, and summary. Rehearsal
topics may still describe the capabilities participants practice.
