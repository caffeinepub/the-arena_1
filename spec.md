# Specification

## Summary
**Goal:** Display the uploader's artist/profile display name in the "Uploaded by" label on content cards and detail pages.

**Planned changes:**
- In the `ContentCard` component, look up the uploader's profile by their principal and render their display name in the "Uploaded by" label (e.g., "Uploaded by ArtistName").
- Apply the same fix on `ContentDetailPage` (and any other location) where "Uploaded by" is displayed.
- If the uploader has no display name, fall back to a shortened principal or "Unknown Artist".
- Make the displayed name link/navigate to the uploader's profile page.

**User-visible outcome:** Users see the actual artist/profile name next to "Uploaded by" on content cards and detail pages, with a link to the uploader's profile, instead of a raw principal or placeholder text.
