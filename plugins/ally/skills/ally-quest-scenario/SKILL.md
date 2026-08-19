---
name: ally-quest-scenario
description: Design, review, edit, and locally validate credible Ally Quest scenario JSON, including inject progression, decision polls, impacts, synthetic media, facilitator guidance, and MITRE ATT&CK mappings. Use when a user asks to build a quest scenario, improve generated scenario content, prepare scenario inputs for a quest, or check a QuestScenario artifact before using Ally MCP quest workflows.
---

# Ally Quest Scenario

Build a playable, internally consistent cybersecurity tabletop scenario that
matches Ally's `QuestScenario` contract and the product generator's quality
rules.

## Workflow

1. Determine whether the user wants design/review only or an Ally data change.
   Do not write to Ally unless the user requests it.
2. Read [references/inputs.md](references/inputs.md). Collect the outcome,
   organization context, genre, duration, inject count, roles, incident focus,
   objectives, challenge settings, constraints, source material, and language.
   Ask only about omissions that materially change the scenario.
3. For an edit, retrieve the current quest or scenario first. Preserve its
   stable IDs, uploaded media references, corrected facts, and user-authored
   constraints unless the user explicitly replaces them.
4. Use the planner/worker method in
   [references/authoring-guide.md](references/authoring-guide.md): make a compact
   beat sheet, then author each scenario independently against the exact
   structure.
5. Save each scenario as JSON and validate it:

   ```bash
   node scripts/validate-quest-scenario.mjs scenario.json --warnings-as-errors
   ```

6. Fix every error. Resolve each warning or explain why the user requested the
   exception. Re-run validation after changes.
7. If the user requested an Ally write, inspect the live MCP schema before
   calling `createQuest` or `editQuest`. Those tool names do not imply that the
   current server accepts scenario JSON. If the live schema has only quest
   identity fields, present the validated artifact and use
   `$ally-scenario-template` when a reusable draft is the intended destination.
8. Retrieve the affected Ally record after any supported write and report the
   resulting state.

## Credibility Standard

- Separate verified facts, reasonable inference, and exercise fiction. Never
  present invented connective tissue as sourced incident history.
- Preserve causal mechanics: initial access, progression, detection, business
  consequence, and response pressure must form one coherent chain.
- Use sources as evidence, not decoration. For a real incident, prefer a victim
  or government record plus independent technical or investigative reporting.
- Map ATT&CK IDs only to behavior actually present in that inject. Verify each
  ID against the current official Enterprise catalog; a regex match is not
  proof that a technique is active or appropriate.
- Keep legal duties conditional on jurisdiction, data class, and current
  authority. Do not invent a definitive notification deadline.
- Use fictional names and reserved domains for synthetic media. Do not include
  live credentials, indicators, exploit instructions, personal data, or victim
  infrastructure.
- Every inject must remain plausible after any earlier poll choice. Do not
  narrate that participants selected a specific option.

## Structural Quality Gates

- Prefer 4-8 injects, beginning at `T+0 min` and increasing strictly.
- Give every inject one decision-relevant development, one poll with ordered
  options `A`, `B`, `C`, one synthetic media artifact, and a facilitator guide.
- Give every option exactly the five Ally impact categories and make
  `biggest_impact` match a highest numeric impact.
- Make choices credible tradeoffs rather than one correct answer and two
  negligent distractors.
- Keep titles, situations, descriptions, actions, indicators, and facilitator
  guidance concise enough to read aloud.
- Match `injects_count` and `roles_count` to their arrays and keep IDs unique.

Read [references/scenario-contract.md](references/scenario-contract.md) when
authoring or diagnosing a validation failure. The local validator checks shape
and deterministic quality rules; Ally's live contract remains authoritative.
