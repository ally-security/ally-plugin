# Scenario Data Model

Use this as the compact domain reference for Ally quest scenario work.

## Quest

A quest is the authored exercise workspace. It stores the organization profile,
exercise setup, generated scenario candidates, selected scenario, and run
sessions.

- `is_published`: run-ready state. Published quests are locked from MCP scenario replacement.
- `quest_data.generated_scenarios`: scenario candidates stored on the quest.
- `quest_data.selected_scenario_id`: the chosen scenario id.
- `selected_scenario`: the full chosen scenario returned by quest read tools.
- `sessions`: dry-run and live-run records derived from the quest.

## Lifecycle Statuses

- `QUEST_IDLE`: no meaningful setup yet.
- `QUEST_SCENARIOS_GENERATING`: setup/generation in progress or saved setup without selected scenario.
- `QUEST_SCENARIOS_GENERATED_NOT_SELECTED`: candidates exist, but no selected scenario.
- `QUEST_SCENARIO_SELECTED`: selected scenario exists, not published.
- `QUEST_PUBLISHED`: selected scenario is run-ready and locked from scenario replacement.
- `QUEST_RUNNING`: live run is in progress.
- `QUEST_FINISHED`: live run has ended.

## Scenario Replacement

Scenario editing through MCP is full replacement:

- Read the quest first.
- Use the current `selected_scenario` as the base.
- Preserve the selected scenario `id`.
- Preserve fields that are not intentionally changed.
- Submit a complete `Scenario` object.
- Do not attempt scenario replacement for published, running, or finished quests.

## Scenario Fields

- `title`: incident type; should match a selected priority incident type when available.
- `subtitle`: attack vector; should match a selected likely attack path when available.
- `summary`: short card/review overview.
- `description`: compact scenario description.
- `objectives`: stage goals copied exactly when provided.
- `background`: three complete sentences in generated scenarios.
- `attack_narrative`: short attack progression.
- `ttps`: MITRE ATT&CK technique IDs only.
- `duration_minutes`: tabletop session length, not attack timeline length.
- `roles`: participant roles.
- `injects`: chronological scenario events.
- `reference_time`: base clock for timeline tags.

## Inject Fields

- `timedelta`: presentation offset from scenario start.
- `situation`: one-sentence immediate update.
- `description`: detailed operational context.
- `expected_action`: next participant decision, coordination step, or escalation.
- `key_indicator`: evidence or indicators.
- `mitre_attack_ttps`: MITRE ATT&CK technique IDs only.
- `polls`: decision points with options `A`, `B`, and `C`.
- `facilitator_guide`: facilitator-only discussion support.

## Scenario Generation Principles

- Use organization, business, technical, vendor, risk, and role context when present.
- Treat challenge sliders as intensity controls.
- Keep injects chronological and escalating.
- Use timeline tags instead of literal timestamps.
- Include one realistic decision poll per inject when generating fresh scenarios.
- Include facilitator guide content for every inject.
