# Specification

## Summary
**Goal:** Add a "What's on Your Mind?" page where users can write and share posts/thoughts, optionally attach media, and interact with a community feed.

**Planned changes:**
- Add a `Post` data model in the backend with fields for postId, authorPrincipal, textContent, optional media blob/mimeType, createdAt, and likes; stored in stable memory
- Expose backend functions: `createPost`, `deletePost`, `getAllPosts`, `getPostsByUser`, and `likePost`
- Add React Query hooks in `useQueries.ts` for all post operations (`useGetAllPosts`, `useGetPostsByUser`, `useCreatePost`, `useDeletePost`, `useLikePost`) with proper cache invalidation
- Create `WhatsOnYourMindPage.tsx` with a post composer (text area with 500-character live counter, optional image/video attachment with preview, submit button with loading state) and a reverse-chronological post feed
- Each post card shows author avatar, display name, post text, optional media, like button with count, timestamp, and a delete button (author only)
- Unauthenticated users see the read-only feed; the composer is hidden or disabled
- Register route `/mind` in `App.tsx` and add a "Mind" navigation link in the sticky header alongside existing nav links

**User-visible outcome:** Users can navigate to the "What's on Your Mind?" page, compose and publish text posts with optional media, like posts, and delete their own posts from a live community feed.
