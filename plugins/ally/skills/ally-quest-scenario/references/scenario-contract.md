# Quest Scenario Contract

The local validator checks the authoring subset below. The authenticated Ally
MCP tool schema and server validation are always authoritative.

## Scenario

Required fields:

```text
attack_narrative: string
background: optional string or null
background_media_attachments: media[] (maximum 1)
category_tags: string[]
description: string
duration_minutes: positive integer
genre_tag: string
id: non-empty string
injects: inject[]
injects_count: integer equal to injects.length
objectives: string[]
regulatory_drivers: string[]
relevant_industries: string[]
roles: string[]
roles_count: integer equal to roles.length
subtitle: string
summary: string
title: string
ttps: MITRE ATT&CK ID[]
```

Optional fields are `is_recommended` and `reference_time`. Unknown fields are
rejected by the canonical contract.

## Inject

```text
description: string
difficulty: Easy | Medium | Hard
expected_action: string
facilitator_guide:
  discussion_questions: string[]
  learning_objectives: string[]
  what_to_listen_for: string[]
id: string
key_indicator: string[]
media_attachments: media[] (maximum 1)
mitre_attack_ttps: MITRE ATT&CK ID[]
polls: poll[]
situation: string
timedelta: T+N min
timedelta_situation: optional string
title: string
```

## Poll option

```text
id: A | B | C
title: string
description: string
impacts:
  - category: one exact Ally impact category
    value: integer -100..100
biggest_impact:
  category: one exact Ally impact category
  value: integer -100..100
```

## Media

Supported synthetic authoring shapes:

- `email`: `from_address`, `to_addresses`, `subject`, `body`
- `slack_thread`: optional `channel`; messages with `author`, optional `emoji`,
  `reactions`, `text`, and `timedelta`
- `iphone_msg`: messages with `sender`, `text`, and `timedelta`
- `log`: `content` and optional `title`

Ally also supports uploaded image/PDF/video and YouTube references, but never
invent an upload `s3_key` or an external video ID merely to satisfy validation.
