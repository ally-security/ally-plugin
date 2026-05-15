---
name: tabletop
description: Facilitate Ally Security tabletop exercise planning, preparation, review, and reporting. Use when creating, auditing, summarizing, or improving tabletop exercises.
---

# Tabletop

Use this skill to support facilitator-ready tabletop exercise workflows with
Ally Security data and MCP context. Focus on what the data means and how to
turn it into practical facilitator or client-facing output.

## MCP Capabilities

When MCP is available through the user's connected config, start with:

1. `whoami` - confirm the authenticated user.
2. `list_organizations` - discover accessible organizations.
3. `list_tabletops` - find relevant tabletop exercises across one or more organizations.
4. `get_tabletop` - fetch the full `TabletopV2` graph for a specific tabletop.

Use `list_auditlogs` and `list_knowledgebase` when the request depends on
organization history, source material, or supporting evidence.

Tabletop MCP tools are currently read-oriented. PDF/report export is not an MCP
tool; use the authenticated Ally API/export flow or a local script for report
generation.

## Data Model Meaning

A tabletop is the analyzed result of a completed or processing tabletop
exercise, usually tied to a recorded meeting.

- `tabletop.title` is the report title. It may be AI-generated or user-corrected.
- `tabletop.summary` is the high-level narrative summary of the exercise.
- `started_at` and `duration` describe when the session happened and how long it ran.
- `status` describes report readiness: `PROCESSING`, `READY`, `REVIEWED`, `EDITED`, or `FAILED`.
- `objectives` are the intended exercise goals.
- `injects` are observed exercise segments, each with a title, summary, and start/end time.
- `participants` maps people to exercise roles and sub-roles.
- `role_name_mapping` resolves role tags in text to participant names or role names, depending on display settings.
- `discussions` are extracted participant contributions, grouped as questions, ideas, or process comments.
- `gaps` are observed improvement areas, usually categorized as people, process, or technology.
- `actions` are follow-up items; `high_importance` marks items that need elevated attention.
- `mitre_attack_chain` and related tactics describe the attack chain and mapped MITRE context.
- `ttx_score` captures incident-response scoring by area.
- `sentiment_analysis`, `talktime`, and `timeline` describe meeting dynamics and sequence.
- `knowledgebase_modules` are related knowledge-base report modules, such as IR plan gaps.
- `has_corrections` means user edits or saved corrections changed the generated report.

## Status Meaning

- `PROCESSING` - analysis/report generation is still running.
- `READY` - generated report is available for review.
- `REVIEWED` - a user reviewed the report.
- `EDITED` - corrections or meaningful report edits exist.
- `FAILED` - analysis or report generation failed.

When `status` is `PROCESSING` or `FAILED`, avoid presenting the report as final.
When `has_corrections` is true or status is `EDITED`, prefer corrected values
over raw generated values.

## Use When

- The user asks to summarize an existing tabletop.
- The user asks what tabletops exist for an organization.
- The user wants facilitator prep, agenda, roles, inject timing, or debrief notes.
- The user asks to convert tabletop data into a report, checklist, or client-facing summary.
- The user asks whether a tabletop is complete, realistic, or ready to run.

## Do Not Use MCP For

- Generating a PDF directly. Use `scripts/create_pdf_report.ts` or the Ally export API.
- Editing quest scenarios. Use the `quest-scenario` skill and quest MCP tools.
- Company DNS research. Use the `quest-scenario` skill's DNS script or the company profile agent path.

## Reference Files

- `files/` - supporting templates, checklists, and source material for this skill.
- `files/mcp-capabilities.md` - tabletop-specific MCP capability notes.

## Scripts

- `scripts/` - utility scripts for generating, validating, or transforming tabletop materials.
- `scripts/create_pdf_report.ts` - placeholder script entrypoint for report/export work.

## Instructions

When helping with tabletop exercises:

1. Clarify the organization, audience, incident type, timebox, and desired outcomes.
2. If the user references an existing tabletop, use MCP discovery before drafting.
3. Ground summaries in `get_tabletop` data; do not invent roles, participants, decisions, or exercise status.
4. Explain data semantics when asked: distinguish generated findings, user corrections, observed discussion, scored gaps, and follow-up actions.
5. Structure outputs around facilitator-friendly phases: preparation, opening context, inject flow, discussion prompts, decision points, debrief, and follow-up actions.
6. Keep client-facing outputs practical, concise, and ready to run.
7. When generating report content, separate source-of-truth data from narrative polish so it is clear what came from Ally data and what was synthesized.
