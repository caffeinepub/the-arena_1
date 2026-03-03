# Specification

## Summary
**Goal:** Make follower lists and counts publicly visible to all users (authenticated or not) on The Arena.

**Planned changes:**
- Add a public backend query that returns the list of followers for any user principal, callable without authentication.
- Display the follower count on every user's profile page, visible to all visitors including unauthenticated users.
- Make the follower count clickable to open a modal/popover listing the display names of all followers.
- Fetch the followers list using the new public backend query for both own and other users' profiles.

**User-visible outcome:** Any visitor (logged in or not) can view a profile's follower count and click it to see the full list of followers by display name.
