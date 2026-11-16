# Incident article editing

These tools are platform-admin-only. Writes are available in production only.

Find the article with `list_incident_articles`, then call
`get_incident_article` for its complete source and SHA. Preserve frontmatter,
canonical research metadata, supported MDX components, and facts outside the
requested edit. Verify new factual claims with appropriate primary sources.

Send the complete source through `edit_incident_article`, using the current
SHA as `expectedSha`. On conflict, retrieve the latest source and reconcile
the change. After a timeout, read again before deciding whether to retry.

The write goes directly to the configured GitHub branch. Published edits go
live after the automatic build; changing published to draft unpublishes the
article. Preserve status unless the user requests a visibility change. Report
the saved status accurately, and distinguish a saved edit from a verified
completed site build. Read the article again to verify the saved source.
