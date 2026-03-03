import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@dfinity/principal";
import { Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMessages,
  useGetProfilePicture,
  useGetUserProfile,
  useMarkMessageAsRead,
  useSendMessage,
} from "../hooks/useQueries";

interface ConversationViewProps {
  partnerPrincipal: Principal;
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  const date = new Date(ms);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AvatarBubble({
  principal,
  size = "sm",
}: { principal: Principal; size?: "sm" | "md" }) {
  const { data: pictureBytes } = useGetProfilePicture(principal);
  const { data: profile } = useGetUserProfile(principal);

  const avatarUrl = useMemo(() => {
    if (!pictureBytes || pictureBytes.length === 0) return null;
    const blob = new Blob([new Uint8Array(pictureBytes)], {
      type: "image/jpeg",
    });
    return URL.createObjectURL(blob);
  }, [pictureBytes]);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : principal.toString().slice(0, 2).toUpperCase();

  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border border-arena-neon/20 bg-arena-neon/10 flex items-center justify-center flex-shrink-0`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={profile?.name ?? "User"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-bold text-arena-neon">{initials}</span>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  callerPrincipal,
}: {
  message: Message;
  isOwn: boolean;
  callerPrincipal: Principal;
}) {
  const senderPrincipal = isOwn ? callerPrincipal : message.sender;
  const { data: profile } = useGetUserProfile(senderPrincipal);
  const displayName =
    profile?.name ?? `${senderPrincipal.toString().slice(0, 8)}…`;

  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      <AvatarBubble principal={senderPrincipal} size="sm" />
      <div
        className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
      >
        <span className="text-[10px] text-muted-foreground px-1">
          {displayName}
        </span>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? "bg-arena-neon text-arena-darker rounded-br-sm font-medium"
              : "bg-arena-surface border border-border text-foreground rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(message.timestamp)}
          {isOwn && <span className="ml-1">{message.isRead ? "✓✓" : "✓"}</span>}
        </span>
      </div>
    </div>
  );
}

export default function ConversationView({
  partnerPrincipal,
}: ConversationViewProps) {
  const { identity } = useInternetIdentity();
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const callerPrincipal = identity?.getPrincipal();

  const { data: messages, isLoading: messagesLoading } =
    useGetMessages(partnerPrincipal);
  const { data: partnerProfile, isLoading: partnerProfileLoading } =
    useGetUserProfile(partnerPrincipal);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessageAsRead();

  const partnerName =
    partnerProfile?.name ?? `${partnerPrincipal.toString().slice(0, 8)}…`;

  // Sort messages chronologically (oldest first for display)
  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });
  }, [messages]);

  // Mark unread messages as read when conversation opens.
  // Intentionally depends only on messages?.length to avoid re-running on
  // every render — callerPrincipal and partnerPrincipal are stable references.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional partial deps
  useEffect(() => {
    if (!messages || !callerPrincipal) return;
    messages.forEach((msg, index) => {
      if (
        !msg.isRead &&
        msg.recipient.toString() === callerPrincipal.toString()
      ) {
        // Build the conversation key (sorted participants)
        const p1Str = callerPrincipal.toString();
        const p2Str = partnerPrincipal.toString();
        const conversationKey =
          p1Str < p2Str
            ? { user1: callerPrincipal, user2: partnerPrincipal }
            : { user1: partnerPrincipal, user2: callerPrincipal };

        markAsRead.mutate({
          conversationKey,
          messageIndex: index,
        });
      }
    });
  }, [messages?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: sortedMessages.length is intentional — only scroll when count changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate(
      { recipient: partnerPrincipal, content: trimmed },
      {
        onSuccess: () => {
          setInputText("");
          setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
            100,
          );
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-arena-surface/80">
        <AvatarBubble principal={partnerPrincipal} size="md" />
        <div className="flex-1 min-w-0">
          {partnerProfileLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <p className="font-semibold text-foreground truncate">
              {partnerName}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            {partnerPrincipal.toString().slice(0, 16)}…
          </p>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4 py-4">
        {messagesLoading ? (
          <div className="flex flex-col gap-3">
            {["s1", "s2", "s3", "s4"].map((skId, i) => (
              <div
                key={skId}
                className={`flex items-end gap-2 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
              >
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <Skeleton
                  className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`}
                />
              </div>
            ))}
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-arena-neon/10 flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-arena-neon" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Say hello to {partnerName}!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedMessages.map((msg) => {
              const isOwn = callerPrincipal
                ? msg.sender.toString() === callerPrincipal.toString()
                : false;
              const msgKey = `${msg.sender.toString()}-${msg.timestamp.toString()}`;
              return (
                <MessageBubble
                  key={msgKey}
                  message={msg}
                  isOwn={isOwn}
                  callerPrincipal={callerPrincipal!}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-arena-surface/80">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partnerName}…`}
            rows={1}
            className="flex-1 resize-none bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-arena-neon/50 focus:border-arena-neon/50 transition-colors min-h-[40px] max-h-[120px] overflow-y-auto"
            style={{ fieldSizing: "content" } as React.CSSProperties}
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || sendMessage.isPending}
            size="icon"
            className="bg-arena-neon text-arena-darker hover:bg-arena-neon/90 shadow-neon rounded-xl flex-shrink-0 h-10 w-10"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
