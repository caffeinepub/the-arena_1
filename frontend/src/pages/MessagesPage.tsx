import { useState, useMemo, useEffect } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { Principal } from '@dfinity/principal';
import { MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetConversations, useGetUserProfile, useGetProfilePicture } from '../hooks/useQueries';
import ConversationView from '../components/ConversationView';
import type { Conversation } from '../backend';

function formatRelativeTime(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  const now = Date.now();
  const diff = now - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface ConversationRowProps {
  conversation: Conversation;
  callerPrincipalStr: string;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationRow({ conversation, callerPrincipalStr, isSelected, onClick }: ConversationRowProps) {
  const partnerPrincipal =
    conversation.participants.user1.toString() === callerPrincipalStr
      ? conversation.participants.user2
      : conversation.participants.user1;

  const { data: partnerProfile, isLoading: profileLoading } = useGetUserProfile(partnerPrincipal);
  const { data: pictureBytes } = useGetProfilePicture(partnerPrincipal);

  const avatarUrl = useMemo(() => {
    if (!pictureBytes || pictureBytes.length === 0) return null;
    const blob = new Blob([new Uint8Array(pictureBytes)], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  }, [pictureBytes]);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  const partnerName = partnerProfile?.name ?? partnerPrincipal.toString().slice(0, 8) + '…';
  const initials = partnerProfile?.name
    ? partnerProfile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : partnerPrincipal.toString().slice(0, 2).toUpperCase();

  // Sort messages to get the last one
  const sortedMessages = [...conversation.messages].sort((a, b) => {
    if (a.timestamp < b.timestamp) return 1;
    if (a.timestamp > b.timestamp) return -1;
    return 0;
  });
  const lastMessage = sortedMessages[0];

  // Count unread messages for the caller
  const unreadCount = conversation.messages.filter(
    (m) => !m.isRead && m.recipient.toString() === callerPrincipalStr
  ).length;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-arena-neon/5 border-b border-border/50 ${
        isSelected ? 'bg-arena-neon/10 border-l-2 border-l-arena-neon' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full overflow-hidden border border-arena-neon/20 bg-arena-neon/10 flex items-center justify-center flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={partnerName} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-arena-neon text-sm">{initials}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {profileLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className={`font-semibold text-sm truncate ${unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
              {partnerName}
            </span>
          )}
          {lastMessage && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {formatRelativeTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            {lastMessage
              ? (lastMessage.sender.toString() === callerPrincipalStr ? 'You: ' : '') + lastMessage.content
              : 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <Badge className="bg-arena-neon text-arena-darker text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full flex-shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default function MessagesPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartnerStr, setSelectedPartnerStr] = useState<string | null>(null);
  const [mobileShowConversation, setMobileShowConversation] = useState(false);

  // Read ?partner= query param to open a specific conversation
  const search = useSearch({ from: '/messages' }) as { partner?: string };
  const partnerFromQuery = search?.partner;

  const { data: conversations = [], isLoading: conversationsLoading } = useGetConversations();

  const callerPrincipalStr = identity?.getPrincipal().toString() ?? '';

  // Open conversation from query param on mount
  useEffect(() => {
    if (partnerFromQuery) {
      try {
        Principal.fromText(partnerFromQuery); // validate
        setSelectedPartnerStr(partnerFromQuery);
        setMobileShowConversation(true);
      } catch {
        // invalid principal, ignore
      }
    }
  }, [partnerFromQuery]);

  // Sort conversations by most recent message
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aLast = a.messages.length > 0
        ? Math.max(...a.messages.map((m) => Number(m.timestamp)))
        : 0;
      const bLast = b.messages.length > 0
        ? Math.max(...b.messages.map((m) => Number(m.timestamp)))
        : 0;
      return bLast - aLast;
    });
  }, [conversations]);

  const selectedPartnerPrincipal = useMemo(() => {
    if (!selectedPartnerStr) return null;
    try {
      return Principal.fromText(selectedPartnerStr);
    } catch {
      return null;
    }
  }, [selectedPartnerStr]);

  const handleSelectConversation = (partnerStr: string) => {
    setSelectedPartnerStr(partnerStr);
    setMobileShowConversation(true);
    navigate({ to: '/messages', search: { partner: partnerStr } });
  };

  const handleBackToList = () => {
    setMobileShowConversation(false);
    setSelectedPartnerStr(null);
    navigate({ to: '/messages', search: { partner: undefined } });
  };

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <MessageCircle className="w-12 h-12 text-arena-neon mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-foreground mb-2">Messages</h2>
        <p className="text-muted-foreground">Please log in to access your messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-display text-arena-neon neon-text mb-6 flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        Messages
      </h1>

      <div className="bg-arena-surface border border-border rounded-2xl overflow-hidden flex h-[calc(100vh-220px)] min-h-[400px]">
        {/* Conversations list — hidden on mobile when conversation is open */}
        <div
          className={`flex flex-col border-r border-border ${
            mobileShowConversation ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 flex-shrink-0`}
        >
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-arena-neon/50 focus:border-arena-neon/50 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28 mb-1.5" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <MessageCircle className="w-10 h-10 text-arena-neon/30 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Visit a user's profile to start a conversation.
                </p>
              </div>
            ) : (
              sortedConversations.map((conv) => {
                const partnerPrincipal =
                  conv.participants.user1.toString() === callerPrincipalStr
                    ? conv.participants.user2
                    : conv.participants.user1;
                const partnerStr = partnerPrincipal.toString();
                return (
                  <ConversationRow
                    key={partnerStr}
                    conversation={conv}
                    callerPrincipalStr={callerPrincipalStr}
                    isSelected={selectedPartnerStr === partnerStr}
                    onClick={() => handleSelectConversation(partnerStr)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Conversation detail */}
        <div
          className={`flex-1 flex flex-col ${
            mobileShowConversation ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedPartnerPrincipal ? (
            <>
              {/* Mobile back button */}
              <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-arena-surface/80">
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-arena-neon transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
              <ConversationView partnerPrincipal={selectedPartnerPrincipal} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MessageCircle className="w-14 h-14 text-arena-neon/20 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list, or visit a user's profile to start a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
