# Tabletop Data Notes

Use this as the compact domain reference for Ally tabletop report work.

## Tabletop Tools

- `list_tabletops(organization_id?, page_index?, page_size?)`
  - Lists tabletops across accessible organizations or one organization.
  - Results are ordered by `updated_at` descending.
- `get_tabletop(tabletop_id)`
  - Fetches one tabletop as the full `TabletopV2` graph.

## Field Meaning

- `tabletop`: base report metadata, including title, summary, status, timing, insights, lessons, recommendation, and corrections.
- `objectives`: intended exercise objectives.
- `actions`: follow-up actions; `high_importance` marks elevated items.
- `discussions`: extracted discussion items, categorized as question, idea, or process.
- `participants`: participant and role assignments.
- `gaps`: observed people/process/technology gaps.
- `injects`: observed exercise segments with start/end offsets.
- `mitre_attack_chain`: mapped adversary chain and MITRE context.
- `sentiment_analysis`: stress and sentiment observations by inject.
- `ttx_score`: incident-response scoring.
- `talktime`: speaking-time distribution.
- `timeline`: ordered exercise events.
- `knowledgebase_modules`: related knowledge-base report modules.
- `has_corrections`: generated report has user corrections or edits.

## Status Meaning

- `PROCESSING`: analysis/report is still running.
- `READY`: generated report is ready for review.
- `REVIEWED`: report has been reviewed.
- `EDITED`: report has corrections or saved edits.
- `FAILED`: analysis/report generation failed.

## Boundary

MCP currently does not export tabletop PDFs. For reports, use the Ally API export
surface or `../scripts/create_pdf_report.ts` as the plugin script entrypoint.
