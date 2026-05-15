---
name: quest-scenario
description: Create, inspect, and replace Ally quest scenarios. Use when designing scenario arcs, injects, roles, decision polls, media, facilitator notes, or explaining quest lifecycle data.
---

# Quest Scenario

Use this skill to reason about Ally quest data and to build complete
replacement scenarios that can be saved through the connected MCP configuration.

## Data Model Meaning

A quest is the authored exercise workspace. It contains organization context,
exercise configuration, generated scenario candidates, the selected scenario,
and run sessions.

- `quest_data` is the editable configuration and generated content.
- `organization_profile` describes the target company: basic identity, business operations, technical infrastructure, and risk assessment.
- `generated_scenarios` are candidate scenarios produced from the quest profile.
- `selected_scenario_id` points to the scenario that is intended for dry run or live run.
- `selected_scenario` is the full scenario object returned for convenience.
- `sessions` are dry-run or live-run instances created from the selected scenario.
- `is_published` means the quest has moved from editable build state into run-ready state. Published quests cannot be edited through scenario replacement.

## Lifecycle Meaning

Common quest statuses:

- `QUEST_IDLE` - little or no quest setup has been saved.
- `QUEST_SCENARIOS_GENERATING` - setup or scenario generation is in progress.
- `QUEST_SCENARIOS_GENERATED_NOT_SELECTED` - scenario candidates exist, but none is selected.
- `QUEST_SCENARIO_SELECTED` - a scenario is selected but not published.
- `QUEST_PUBLISHED` - selected scenario is run-ready and locked from MCP scenario edits.
- `QUEST_RUNNING` - a live run is in progress.
- `QUEST_FINISHED` - the live run has ended.

When editing, only replace an unpublished selected scenario. If a quest is
published, running, or finished, explain that the user should clone it or return
it to an editable workflow before changing scenario content.

## Scenario Meaning

`edit_quest_scenario` performs full scenario replacement. Do not send patches.
Construct and preserve a complete `Scenario` object.

- `id` - scenario identifier. Preserve the selected scenario id.
- `genre_tag` - exercise style, such as executive, operational, technical, or crisis communications.
- `category_tags` - short labels for grouping or filtering.
- `title` - incident type label. When priority incident types exist, use one of those titles.
- `subtitle` - attack vector label. When likely attack paths exist, use one of those titles.
- `summary` - 1-2 sentence overview for cards and quick review.
- `description` - compact scenario description.
- `objectives` - exercise objectives. If stage goals exist, preserve them exactly and in order.
- `background` - exactly three complete sentences of scenario background when following generation rules.
- `background_media_attachments` - at most one uploaded image or PDF.
- `attack_narrative` - 3-4 short sentences describing the attack progression.
- `ttps` - MITRE ATT&CK technique IDs only, without technique names.
- `relevant_industries` and `regulatory_drivers` - context tags.
- `duration_minutes` - tabletop session length, not the in-world attack duration.
- `roles` and `roles_count` - participant roles and expected role count.
- `injects` and `injects_count` - chronological incident events and expected count.
- `is_recommended` - whether this scenario is the recommended option among candidates.
- `reference_time` - base datetime for timeline tags and wall-clock rendering.

## Inject Meaning

Injects are the moments participants react to during the exercise.

- `title` is short and specific.
- `timedelta` is when the inject is presented relative to scenario start; inject 1 should normally be `T+0 min`.
- `situation` is exactly one sentence stating the immediate update.
- `description` is 3-5 sentences explaining symptoms, knowns, unknowns, and urgency.
- `difficulty` is `Easy`, `Medium`, or `Hard`.
- `mitre_attack_ttps` contains MITRE technique IDs only.
- `key_indicator` lists indicators or evidence participants can use.
- `expected_action` is one sentence naming the next decision, coordination step, or escalation.
- `media_attachments` may contain at most one email, log, Slack thread, iPhone-style message, uploaded image, or uploaded PDF.
- `facilitator_guide` is facilitator-only and should include `discussion_questions`, `learning_objectives`, and `what_to_listen_for`.

Decision polls should include exactly one realistic decision per inject, with
options `A`, `B`, and `C`. Each option needs a short `title`, concrete
`description`, and impacts for `Brand Damage`, `Business Disruption`,
`Financial Impact`, `Dwell Time`, and `Data Exposure Risk`.

## Scenario Generation Guidance

Use organization, risk, business, technical, vendor, role, and constraint data
when it exists. Treat challenge fields as intensity controls:

- `challenge_time_pressure` increases deadline pressure and urgency.
- `challenge_fog_of_war` increases ambiguity and incomplete information.
- `challenge_chaos_agents` increases stakeholder, vendor, attacker, or operational interference.
- `challenge_red_herrings` increases plausible distractions and misleading signals.

The in-world incident narrative usually spans 1-5 days, while
`exercise_duration` controls the tabletop session length. Use timeline tags
like `[[scenario_reference_time]]`, `[[inject_time]]`, and
`[[inject_time:+45m]]` instead of literal timestamps in participant-facing
scenario text, media, and poll options.

Executive scenarios should include strategic stakes, business impact,
communications, legal or regulatory pressure, governance, and resource
tradeoffs. Technical detail should support decision-making rather than dominate
the scenario.

## Use When

- The user asks to list, inspect, summarize, clone, or edit Ally quests.
- The user wants to make an inject more realistic, executive-ready, simpler, harder, or clearer.
- The user asks to add injects, decision polls, facilitator notes, MITRE ATT&CK IDs, or scenario background.
- The user asks to adapt a scenario for a specific organization, industry, threat model, or incident type.
- The user asks what quest fields, statuses, publication state, sessions, scenarios, injects, or poll impacts mean.

## Research And DNS

Use `scripts/get_dns_records.ts` as the plugin-local script reference for DNS
context. Treat DNS, StackShare, and company research as supporting evidence for
infrastructure, vendors, likely attack paths, and realistic inject artifacts.

## Reference Files

- `files/` - supporting examples, scenario briefs, inject libraries, and source material for this skill.
- `files/scenario-data-model.md` - quest lifecycle, scenario field, and scenario generation notes.

## Scripts

- `scripts/` - utility scripts for generating, validating, or transforming quest scenario materials.
- `scripts/get_dns_records.ts` - DNS context helper for scenario research.

## Instructions

When creating a quest scenario:

1. Define the organization, scenario premise, stakeholders, constraints, and success criteria.
2. If the user references an existing quest, use `list_quests` and `get_quest` before editing.
3. Base all edits on the current selected scenario; preserve ids and fields unless intentionally changing them.
4. Build a sequence of injects that escalates naturally from early indicators to business impact and executive decision-making.
5. Include expected participant actions, key indicators, MITRE ATT&CK technique IDs where supported, decision polls, and facilitator-only guidance.
6. Before calling `edit_quest_scenario`, make sure the quest is unpublished and the payload is a complete replacement scenario.
