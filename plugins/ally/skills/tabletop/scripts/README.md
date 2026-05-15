# Tabletop Scripts

Place tabletop-specific helper scripts here.

## Script Entrypoints

- `create_pdf_report.ts` - report/export helper entrypoint. The current MCP surface is read-only for tabletops, so PDF generation should happen through this script or the authenticated Ally export API.
