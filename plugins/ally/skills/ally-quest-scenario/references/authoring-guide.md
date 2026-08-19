# Quest Scenario Authoring Guide

## Product generator model

Ally's runtime generator uses a two-stage process. Follow the same separation
when authoring manually:

1. A planner makes a compact candidate plan, not final prose.
2. A worker fills one complete scenario against an exact structural template.
3. Deterministic validation rejects placeholders, bad counts, missing media or
   polls, and invalid structure. A bounded repair pass fixes only reported
   failures.

The current product defaults are three candidates, an 8,000-token planner cap,
and up to 20,000 tokens for each scenario worker. Planner temperature is 0.35;
worker temperature is 0.4. Model calls use up to three attempts, and a worker
gets an initial validation plus at most two repair attempts. These are runtime
budgets, not targets for verbose scenario prose.

## Planner artifact

For every candidate record:

- incident type
- attack path
- one-sentence premise
- stakeholder pressure
- escalation arc
- diversity notes
- source keys worth reading
- exactly one numbered beat per requested inject:
  `N. T+0 min | Easy | purpose | stakeholder pressure`

Candidates should differ in premise, attack path, business impact, decision
pattern, and executive pressure. When editing one scenario, preserve its
identity and improve only the requested areas.

## Narrative and pacing

- Start at `T+0 min`; timings increase strictly and stay inside exercise
  duration.
- The incident narrative can span more time than the facilitated exercise.
  Product guidance typically models 36-84 incident hours, with broader
  narrative timing expressed as relative timeline language.
- Do not hard-code a wall-clock date unless the exercise explicitly requires
  one. Use `T+N min` for presentation time.
- Escalate through ambiguous signal, confirmed mechanism, scope/progression,
  consequence, stakeholder pressure, and recovery/disclosure as appropriate.
- Do not reveal every later fact in the opening summary.

## Inject and decision design

Each inject should have a title of at most seven words, a one-sentence
situation, a concise description of knowns/unknowns/urgency, one expected
action, and one or two key indicators.

Each poll asks one concrete question, normally in 20 words or fewer. Options
`A`, `B`, and `C` should have two-to-six-word titles and short imperative
actions. Make all three plausible under incomplete information. Vary tradeoffs
among containment, continuity, evidence preservation, disclosure, cost, and
stakeholder trust.

Impact categories are exactly:

1. `Brand Damage`
2. `Business Disruption`
3. `Financial Impact`
4. `Dwell Time`
5. `Data Exposure Risk`

Values are integers from -100 through 100. A useful per-inject starting budget
is `ceil(100 / inject_count)`. Repeatedly selecting the worst option should
usually accumulate roughly 80-120 in each category; negative values are rare
and mean an action actually reduces that risk.

## Facilitator and media

Give each inject three discussion questions, two learning objectives, and a
`what_to_listen_for` array beginning with the exact `expected_action`, followed
by at least two observable coordination or leadership signals.

Use exactly one media artifact per inject. Prefer `email`, `slack_thread`,
`iphone_msg`, or `log`. Match the artifact to the prose, use fictional people,
and use `example.test` addresses for synthetic email. Chat emoji values must be
literal Unicode emoji, not shortcodes.

## Evidence and ATT&CK

For source-based content, maintain a small claim ledger while drafting:

- fact: directly supported
- inference: reasonable but not directly stated
- exercise fiction: invented pressure or connective tissue

Verify central factual claims with independent provenance when practical. Map
one to three active Enterprise ATT&CK techniques only when the inject contains
the matching adversary behavior. Business, legal, and communications-only
injects may correctly use an empty list.
