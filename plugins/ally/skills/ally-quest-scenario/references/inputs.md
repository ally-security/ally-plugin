# Quest Scenario Inputs

Collect enough information to make the scenario consequential and playable.
Use explicit user constraints ahead of creative defaults, while keeping safety,
schema, exact counts, and valid structure highest priority.

## Author inputs

| Input | Why it matters | Product-aligned default |
|---|---|---|
| Desired outcome | Defines what the exercise should reveal or rehearse | Ask for one concrete outcome |
| Organization profile | Grounds services, dependencies, sector, risk, and stakeholders | Use Ally organization context when available |
| Exercise genre | Changes the decision lens | Technical, Operational, Comms Crisis, or Executive |
| Exercise duration | Sets facilitator pacing | 60-75 minutes |
| Inject count | Controls escalation resolution | 6; usually 4-8 |
| Participant roles | Determines decision ownership | 4-10 cross-functional roles |
| Incident focus | Anchors the threat and consequence | One coherent incident type and attack path |
| Objectives | Creates observable learning goals | 3-5 objectives |
| Challenge settings | Tunes ambiguity, distractions, disruption, and deadlines | Medium when unspecified |
| Explicit constraints | Captures must-use/must-avoid instructions | Treat as high priority |
| Sources or URLs | Grounds technical and stakeholder realism | Read only when materially useful |
| Language/locale | Controls all participant-facing text | User's requested locale |
| Existing scenario | Required for a safe edit | Preserve IDs and corrected fields |

## Quest generator field mapping

The Ally generator derives its canonical context from these Quest data fields:

- `exercise_duration`, `exercise_genre`, `exercise_injects_count`
- `stage_participant_roles`, `stage_selected_incidents`, `stage_goals`
- `stage_boundaries` for explicit user instructions
- `stage_custom_contexts` for supporting context
- `challenge_time_pressure`, `challenge_fog_of_war`,
  `challenge_chaos_agents`, and `challenge_red_herrings` on a 0-100 scale
- `inject_verbosity`: `low`, `medium`, or `high`
- `organization_profile`, `scenario_start_time`, and output locale
- existing scenarios for edit, fetched URL content, and a stable generation seed

For a request that does not expose these fields directly, translate the user's
natural-language requirements into the same concepts before writing.

## Challenge interpretation

- Time pressure: low permits analysis; high creates deadlines and rapid choices.
- Fog of war: low provides clear evidence; high reveals incomplete or
  conflicting facts.
- Chaos agents: low keeps outside interference quiet; high adds vendor,
  attacker, media, employee, customer, or operational disruption.
- Red herrings: low keeps clues direct; high adds plausible distractions
  without making the scenario unfair.
