import { useState } from 'react';
import { useGetComments, useAddComment, useDeleteComment } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import type { Comment, UserProfile } from '../backend';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationDialog from './ConfirmationDialog';

interface CommentItemProps {
  comment: Comment;
  contentId: string;
  currentPrincipal?: string;
}

function formatCommentTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function useGetUserProfileForPrincipal(principal: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal],
    queryFn: async () => {
      if (!actor || !identity) return null;
      try {
        const { Principal } = await import('@dfinity/principal');
        return actor.getUserProfile(Principal.fromText(principal));
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principal && !!identity,
    staleTime: 5 * 60 * 1000,
  });
}

function CommentItem({ comment, contentId, currentPrincipal }: CommentItemProps) {
  const authorPrincipal = comment.author.toString();
  const { data: authorProfile } = useGetUserProfileForPrincipal(authorPrincipal);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner = currentPrincipal && currentPrincipal === authorPrincipal;
  const displayName = authorProfile?.name ?? `${authorPrincipal.slice(0, 8)}...`;

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteComment(
      { contentId, commentId: comment.id },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          toast.success('Comment deleted');
        },
        onError: () => {
          toast.error('Failed to delete comment');
        },
      },
    );
  };

  return (
    <>
      <div className="flex gap-3 py-3 border-b border-arena-border last:border-b-0">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-arena-neon/10 border border-arena-neon/30 flex items-center justify-center">
          <span className="text-arena-neon text-xs font-bold">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatCommentTime(comment.timestamp)}
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed break-words">{comment.text}</p>
        </div>

        {/* Delete button (owner only) */}
        {isOwner && (
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            aria-label="Delete comment"
            className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Comment"
        description="Are you sure you want to permanently delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        destructive
      />
    </>
  );
}

interface CommentsSectionProps {
  contentId: string;
}

export default function CommentsSection({ contentId }: CommentsSectionProps) {
  const { identity, login } = useInternetIdentity();
  const { data: comments = [], isLoading, error } = useGetComments(contentId);
  const { mutate: addComment, isPending: isSubmitting } = useAddComment();
  const [commentText, setCommentText] = useState('');

  const currentPrincipal = identity?.getPrincipal().toString();

  // Sort comments by timestamp descending (newest first)
  const sortedComments = [...comments].sort((a, b) => {
    return Number(b.timestamp - a.timestamp);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    if (!identity) {
      toast.info('Please log in to comment');
      login();
      return;
    }

    addComment(
      { contentId, text: trimmed },
      {
        onSuccess: () => {
          setCommentText('');
          toast.success('Comment posted!');
        },
        onError: () => toast.error('Failed to post comment'),
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <section aria-label="Comments" className="bg-card border border-arena-border rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
        <MessageCircle className="w-4 h-4" />
        Comments
        {comments.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded bg-arena-neon/15 text-arena-neon text-xs font-bold">
            {comments.length}
          </span>
        )}
      </h3>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="mb-4">
        {identity ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment… (Ctrl+Enter to submit)"
              rows={3}
              maxLength={1000}
              disabled={isSubmitting}
              className="bg-arena-surface border-arena-border text-foreground placeholder:text-muted-foreground resize-none focus:border-arena-neon/50 focus:ring-arena-neon/20 transition-colors"
              aria-label="Comment text"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {commentText.length}/1000
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !commentText.trim()}
                className="bg-arena-neon text-arena-darker hover:bg-arena-neon/90 font-bold transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Posting…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => login()}
            className="w-full py-3 rounded-lg border border-dashed border-arena-border text-sm text-muted-foreground hover:border-arena-neon/40 hover:text-arena-neon transition-colors"
          >
            Log in to leave a comment
          </button>
        )}
      </form>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 py-3">
              <Skeleton className="w-8 h-8 rounded-full bg-arena-surface flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24 bg-arena-surface" />
                <Skeleton className="h-4 w-full bg-arena-surface" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-4">Failed to load comments.</p>
      ) : sortedComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div>
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id.toString()}
              comment={comment}
              contentId={contentId}
              currentPrincipal={currentPrincipal}
            />
          ))}
        </div>
      )}
    </section>
  );
}
