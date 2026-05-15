#!/usr/bin/env node

/**
 * Placeholder report entrypoint for the tabletop skill.
 *
 * Simply Ally currently exposes read-oriented tabletop tools:
 * - list_tabletops
 * - get_tabletop
 *
 * PDF/export generation should use the authenticated Ally export API or a
 * future implementation here that renders fetched tabletop data into a report.
 */

const usage = [
  "Usage:",
  "  create_pdf_report.ts <tabletop-json-path> <output-path>",
  "",
  "This scaffold intentionally avoids PDF dependencies until the report format is finalized.",
].join("\n");

console.log(usage);
