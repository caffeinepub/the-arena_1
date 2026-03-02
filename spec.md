# Specification

## Summary
**Goal:** Build "The Arena," a dark-themed social platform on the Internet Computer where users can upload, discover, and play AI-generated music and video content.

**Planned changes:**
- Motoko backend actor storing post metadata (title, description, file type, file blob, album cover blob, thumbnail blob, uploader principal, timestamp, like/comment counts) with `uploadContent`, `getFeed`, `getPost`, and `getUserPosts` calls
- Responsive upload flow supporting MP3, WAV, MP4, WebM, and MOV files with optional album cover and thumbnail fields; all file reading done client-side
- Thumbnail creation tool: video uploads show a scrubber with a "Capture Frame" button (canvas-based PNG export); audio uploads show an image upload field for thumbnail/album cover
- Social discovery feed page with a responsive card grid showing thumbnail, title, uploader, file type badge, and like count
- Detail/player page with HTML5 audio or video player; album cover displayed alongside audio tracks
- Bold dark arena-style theme: near-black background, neon gold/orange accents, glowing card hover effects, modern bold sans-serif typography, consistent across all pages

**User-visible outcome:** Users can upload AI music and video files to The Arena, browse a styled discovery feed, and play content directly in the browser with a high-energy dark stage aesthetic.
