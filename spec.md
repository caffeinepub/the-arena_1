# Specification

## Summary
**Goal:** Add message timestamps and a reply button to the ConversationView message bubbles.

**Planned changes:**
- Display a timestamp below every message bubble in ConversationView, showing time only (e.g., "2:45 PM") for today's messages and day + time (e.g., "Mon 2:45 PM") for older messages, in subtle muted/small text
- Ensure the backend Message type includes a timestamp field and that it is passed through to the ConversationView component
- Add a Reply button to every message bubble (visible on hover or as a persistent icon) in ConversationView
- Clicking Reply populates the message input with a quoted reference (e.g., `> [original message text]\n`) to the original message and focuses the input
- Show a reply-to banner above the input field indicating which message is being replied to, with a cancel option
- Clear the reply context after the reply message is sent

**User-visible outcome:** Users can see when each message was sent or received, and can click a Reply button on any message to quote it in their response before sending.
