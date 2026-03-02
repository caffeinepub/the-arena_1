# Specification

## Summary
**Goal:** Give every authenticated user control over their own profile and content — including editing their profile, deleting their own content, and permanently deleting their account.

**Planned changes:**
- Add a backend `updateProfile` endpoint that only allows a user to update their own profile (validated by principal); expose an "Edit Profile" form in the ProfileMenu pre-filled with current display name.
- Add a backend `deleteContent` endpoint that verifies the caller owns the content before deleting; show a delete button on ContentCard and ContentDetailPage only to the content owner, guarded by a ConfirmationDialog, and remove the item from the feed and playback queue on success.
- Add a backend `deleteProfile` endpoint that verifies the caller's principal before permanently deleting the account and all associated data; add a "Delete Account" option in the ProfileMenu behind a ConfirmationDialog, then log the user out and redirect to the feed on success.
- All ownership checks enforced on the backend; use the existing ConfirmationDialog component for all destructive prompts.

**User-visible outcome:** Logged-in users can edit their display name from the profile menu, delete any content they own with a confirmation step, and permanently delete their own account with a confirmation step followed by automatic logout.
