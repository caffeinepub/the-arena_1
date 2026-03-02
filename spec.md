# Specification

## Summary
**Goal:** Add delete profile and delete content functionality to The Arena platform, with confirmation dialogs and owner-only access controls.

**Planned changes:**
- Add a "Delete Profile" button in the authenticated user's profile area that opens a confirmation dialog before permanently deleting the profile, then logs the user out and redirects to the feed page.
- Expose a backend `deleteProfile` endpoint that removes the caller's profile record.
- Add a "Delete Content" button on content cards and/or the content detail page, visible only to the content owner, that opens a confirmation dialog before permanently deleting the content item.
- Remove deleted content from the feed and related UI without a full page reload.
- Expose a backend `deleteContent` endpoint that accepts a content ID and only allows deletion by the content owner.

**User-visible outcome:** Authenticated users can permanently delete their own profile or any of their own content items via confirmation dialogs, with the UI updating immediately after each deletion.
