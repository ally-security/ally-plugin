# Report corrections

Use this workflow when the user requests a report correction or restore.

1. Resolve the tabletop and organization with the normal list/get tools.
2. Call `getUpdateTabletopReportContext`. Use its allowed commands, typed
   targets, tagging references, and current revision; do not invent target IDs.
3. Apply only the requested corrections through `updateTabletopReport` with
   `expectedRevision`. A batch contains 1-100 edits and applies atomically.
4. On `revisionConflict`, retrieve fresh context and reconcile the requested
   change against the new content. After a timeout, read first to establish
   whether the mutation applied; never blindly replay it.
5. Retrieve the report or editing context again to verify the result.

Recorded evidence and inject structure are locked. Respect the live allowed
commands rather than trying to replace the report's raw stored document.

Use `revertTabletopSectionToOriginal` for a requested section restore. It
preserves other corrections and rejects restores that break references.
`revertTabletopToOriginal` discards all corrections; use it only when the user
requests that full reset. Both require the current expected revision.
