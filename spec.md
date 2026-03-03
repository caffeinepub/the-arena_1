# Specification

## Summary
**Goal:** Improve the message input in ConversationView by adding Enter key submission and a visible Send button.

**Planned changes:**
- Update the message input so pressing Enter (without Shift) sends the message and clears the input field
- Support Shift+Enter to insert a newline without sending
- Add a visible Send button next to the message input, styled to match the Arena neon dark theme
- Disable the Send button when the input is empty
- Return focus to the input field after sending via the Send button

**User-visible outcome:** Users can send messages by pressing Enter or clicking the Send button, with Shift+Enter available for multi-line input.
