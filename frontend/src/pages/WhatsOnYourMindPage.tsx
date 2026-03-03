import { useState, useRef, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Heart, Trash2, Image, X, Loader2, LogIn, Sparkles, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob, type Post, type ThoughtComment } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetAllPosts,
  useCreatePost,
  useDeletePost,
  useLikePost,
  useGetUserProfile,
  useGetProfilePicture,
  useGetThoughtComments,
  useAddThoughtComment,
  useDeleteThoughtComment,
} from '../hooks/useQueries';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import type { Principal } from '@dfinity/principal';

const MAX_CHARS = 500;

// ─── Relative time helper ─────────────────────────────────────────────────────
function relativeTime(timestampNs: bigint): string {
  const ms = Number(timestampNs / 1_000_000n);
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

// ─── Author Avatar ────────────────────────────────────────────────────────────
function AuthorAvatar({ principal }: { principal: Principal }) {
  const { data: profile } = useGetUserProfile(principal);
  const { data: pictureBytes } = useGetProfilePicture(principal);

  const initials = profile?.name
    ? profile.name.slice(0, 2).toUpperCase()
    : principal.toString().slice(0, 2).toUpperCase();

  const avatarSrc = pictureBytes
    ? URL.createObjectURL(new Blob([new Uint8Array(pictureBytes)], { type: 'image/jpeg' }))
    : undefined;

  return (
    <Avatar className="w-10 h-10 border border-arena-neon/30 flex-shrink-0">
      {avatarSrc && <AvatarImage src={avatarSrc} alt={profile?.name ?? 'User'} />}
      <AvatarFallback className="bg-arena-surface text-arena-neon text-xs font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// ─── Thought Comment Item ─────────────────────────────────────────────────────
interface ThoughtCommentItemProps {
  comment: ThoughtComment;
  postId: bigint;
  currentPrincipalStr: string | undefined;
}

function ThoughtCommentItem({ comment, postId, currentPrincipalStr }: ThoughtCommentItemProps) {
  const authorPrincipalStr = comment.author.toString();
  const { data: authorProfile } = useGetUserProfile(comment.author);
  const deleteThoughtComment = useDeleteThoughtComment();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = currentPrincipalStr === authorPrincipalStr;
  const displayName = authorProfile?.name ?? `${authorPrincipalStr.slice(0, 8)}…`;

  const handleConfirmDelete = () => {
    deleteThoughtComment.mutate(
      { postId, commentId: comment.id },
      {
        onSuccess: () => {
          setDeleteOpen(false);
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
      <div className="flex gap-2.5 py-2.5 border-b border-arena-border/50 last:border-b-0">
        {/* Mini avatar */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-arena-neon/10 border border-arena-neon/25 flex items-center justify-center">
          <span className="text-arena-neon text-[10px] font-bold">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-foreground truncate">{displayName}</span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {relativeTime(comment.timestamp)}
            </span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed break-words">{comment.text}</p>
        </div>

        {/* Delete button (owner only) */}
        {isOwner && (
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={deleteThoughtComment.isPending}
            aria-label="Delete comment"
            className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            {deleteThoughtComment.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isPending={deleteThoughtComment.isPending}
        destructive
      />
    </>
  );
}

// ─── Comments Panel ───────────────────────────────────────────────────────────
interface CommentsPanelProps {
  postId: bigint;
  currentPrincipalStr: string | undefined;
  isAuthenticated: boolean;
  onLogin: () => void;
}

function CommentsPanel({ postId, currentPrincipalStr, isAuthenticated, onLogin }: CommentsPanelProps) {
  const { data: comments = [], isLoading } = useGetThoughtComments(postId);
  const addThoughtComment = useAddThoughtComment();
  const [commentText, setCommentText] = useState('');

  const sortedComments = [...comments].sort((a, b) => Number(a.timestamp - b.timestamp));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    addThoughtComment.mutate(
      { postId, text: trimmed },
      {
        onSuccess: () => {
          setCommentText('');
          toast.success('Comment posted!');
        },
        onError: () => {
          toast.error('Failed to post comment');
        },
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
    <div className="mt-3 pt-3 border-t border-arena-border/50">
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="mb-3">
        {isAuthenticated ? (
          <div className="flex gap-2 items-end">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment… (Ctrl+Enter to submit)"
              rows={2}
              maxLength={1000}
              disabled={addThoughtComment.isPending}
              className="flex-1 bg-arena-darker border-arena-border text-foreground placeholder:text-muted-foreground resize-none text-xs focus:border-arena-neon/50 focus:ring-arena-neon/20 transition-colors min-h-0"
              aria-label="Comment text"
            />
            <Button
              type="submit"
              size="sm"
              disabled={addThoughtComment.isPending || !commentText.trim()}
              className="bg-arena-neon text-arena-darker hover:bg-arena-neon/90 font-bold transition-all disabled:opacity-50 flex-shrink-0 h-9 px-3"
            >
              {addThoughtComment.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="w-full py-2 rounded-lg border border-dashed border-arena-border text-xs text-muted-foreground hover:border-arena-neon/40 hover:text-arena-neon transition-colors flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            Log in to comment
          </button>
        )}
      </form>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5 py-2">
              <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedComments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          No comments yet. Be the first!
        </p>
      ) : (
        <div>
          {sortedComments.map((comment) => (
            <ThoughtCommentItem
              key={comment.id.toString()}
              comment={comment}
              postId={postId}
              currentPrincipalStr={currentPrincipalStr}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
interface PostCardProps {
  post: Post;
  currentPrincipalStr: string | undefined;
  isAuthenticated: boolean;
  onLogin: () => void;
}

function PostCard({ post, currentPrincipalStr, isAuthenticated, onLogin }: PostCardProps) {
  const { data: profile } = useGetUserProfile(post.author);
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState<bigint | null>(null);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const isOwner = currentPrincipalStr === post.author.toString();
  const displayLikes = optimisticLikes !== null ? optimisticLikes : post.likes;
  const authorPrincipalStr = post.author.toString();

  // Fetch comment count when panel is not expanded (for badge display)
  const { data: comments = [] } = useGetThoughtComments(post.id);
  const commentCount = comments.length;

  const handleLike = () => {
    if (!currentPrincipalStr) {
      toast.error('Please log in to like posts');
      return;
    }
    setOptimisticLikes(displayLikes + 1n);
    likePost.mutate(post.id, {
      onError: () => {
        setOptimisticLikes(null);
        toast.error('Failed to like post');
      },
    });
  };

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.success('Post deleted');
      },
      onError: () => {
        toast.error('Failed to delete post');
      },
    });
  };

  const mediaUrl = post.media ? post.media.getDirectURL() : null;
  const isVideo = mediaUrl
    ? /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl)
    : false;

  return (
    <article className="bg-arena-surface border border-arena-border rounded-2xl p-5 hover:border-arena-neon/30 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Link to="/profile/$principal" params={{ principal: authorPrincipalStr }}>
          <AuthorAvatar principal={post.author} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to="/profile/$principal"
            params={{ principal: authorPrincipalStr }}
            className="font-semibold text-foreground hover:text-arena-neon transition-colors text-sm"
          >
            {profile?.name ?? authorPrincipalStr.slice(0, 12) + '…'}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(post.timestamp)}</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setDeleteOpen(true)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
            aria-label="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap mb-3">
          {post.content}
        </p>
      )}

      {/* Media */}
      {mediaUrl && (
        <div className="rounded-xl overflow-hidden mb-3 border border-arena-border">
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="w-full max-h-80 object-cover bg-black"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Post media"
              className="w-full max-h-80 object-cover"
            />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 pt-2 border-t border-arena-border/50">
        <button
          onClick={handleLike}
          disabled={likePost.isPending}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-arena-neon transition-colors text-sm group disabled:opacity-50"
          aria-label="Like post"
        >
          <Heart className="w-4 h-4 group-hover:fill-arena-neon group-hover:text-arena-neon transition-all" />
          <span>{displayLikes.toString()}</span>
        </button>

        <button
          onClick={() => setCommentsExpanded((prev) => !prev)}
          className={`flex items-center gap-1.5 transition-colors text-sm group ${
            commentsExpanded
              ? 'text-arena-neon'
              : 'text-muted-foreground hover:text-arena-neon'
          }`}
          aria-label="Toggle comments"
          aria-expanded={commentsExpanded}
        >
          <MessageCircle
            className={`w-4 h-4 transition-all ${
              commentsExpanded ? 'fill-arena-neon/20 text-arena-neon' : 'group-hover:text-arena-neon'
            }`}
          />
          <span>{commentCount}</span>
        </button>
      </div>

      {/* Collapsible comments panel */}
      {commentsExpanded && (
        <CommentsPanel
          postId={post.id}
          currentPrincipalStr={currentPrincipalStr}
          isAuthenticated={isAuthenticated}
          onLogin={onLogin}
        />
      )}

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isPending={deletePost.isPending}
        destructive
      />
    </article>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────
function Composer({ currentPrincipalStr }: { currentPrincipalStr: string }) {
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const canSubmit = (content.trim().length > 0 || mediaFile !== null) && !isOverLimit;

  const handleMediaSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    e.target.value = '';
  }, []);

  const clearMedia = useCallback(() => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
  }, [mediaPreview]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    let mediaBlob: ExternalBlob | null = null;
    if (mediaFile) {
      const bytes = new Uint8Array(await mediaFile.arrayBuffer());
      mediaBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
    }

    createPost.mutate(
      { content: content.trim(), media: mediaBlob },
      {
        onSuccess: () => {
          setContent('');
          clearMedia();
          setUploadProgress(0);
          toast.success('Post shared!');
        },
        onError: (err) => {
          setUploadProgress(0);
          toast.error('Failed to post. Please try again.');
          console.error(err);
        },
      }
    );
  };

  const isVideo = mediaFile?.type.startsWith('video/');

  // suppress unused variable warning — currentPrincipalStr reserved for future composer avatar
  void currentPrincipalStr;

  return (
    <div className="bg-arena-surface border border-arena-border rounded-2xl p-5 mb-6">
      <div className="flex gap-3">
        {/* Avatar placeholder for composer */}
        <div className="w-10 h-10 rounded-full bg-arena-neon/20 border border-arena-neon/40 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-arena-neon" />
        </div>

        <div className="flex-1 min-w-0">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="bg-transparent border-none resize-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base min-h-[80px]"
            maxLength={MAX_CHARS + 50}
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-arena-border inline-block max-w-full">
              {isVideo ? (
                <video
                  src={mediaPreview}
                  className="max-h-48 max-w-full object-cover rounded-xl"
                  muted
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-h-48 max-w-full object-cover rounded-xl"
                />
              )}
              <button
                onClick={clearMedia}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                aria-label="Remove media"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Upload progress */}
          {createPost.isPending && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="h-1 bg-arena-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-arena-neon transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Uploading… {uploadProgress}%</p>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-arena-border/50">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
                aria-label="Attach media"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={createPost.isPending}
                className="p-2 rounded-lg text-muted-foreground hover:text-arena-neon hover:bg-arena-neon/10 transition-all disabled:opacity-50"
                aria-label="Attach image or video"
                title="Attach image or video"
              >
                <Image className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-mono tabular-nums ${
                  isOverLimit
                    ? 'text-destructive'
                    : charsLeft <= 50
                    ? 'text-yellow-500'
                    : 'text-muted-foreground'
                }`}
              >
                {charsLeft}
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || createPost.isPending}
                size="sm"
                className="bg-arena-neon text-arena-darker hover:bg-arena-neon-bright font-semibold px-5 rounded-full disabled:opacity-50"
              >
                {createPost.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Posting…
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WhatsOnYourMindPage() {
  const { identity, login } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const currentPrincipalStr = identity?.getPrincipal().toString();

  const { data: posts = [], isLoading, isError } = useGetAllPosts();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="font-display text-4xl text-arena-neon neon-text tracking-wide mb-1">
          WHAT'S ON YOUR MIND
        </h1>
        <p className="text-muted-foreground text-sm">
          Share your thoughts, ideas, and moments with the community.
        </p>
      </div>

      {/* Composer or login prompt */}
      {isAuthenticated && currentPrincipalStr ? (
        <Composer currentPrincipalStr={currentPrincipalStr} />
      ) : (
        <div className="bg-arena-surface border border-arena-border rounded-2xl p-6 mb-6 flex flex-col items-center gap-3 text-center">
          <LogIn className="w-8 h-8 text-arena-neon/60" />
          <p className="text-muted-foreground text-sm">
            Log in to share your thoughts with the community.
          </p>
        </div>
      )}

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-arena-surface border border-arena-border rounded-2xl p-5">
              <div className="flex gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Failed to load posts. Please try again later.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-arena-neon/30" />
          <p className="text-base font-medium text-foreground/60">No posts yet.</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id.toString()}
              post={post}
              currentPrincipalStr={currentPrincipalStr}
              isAuthenticated={isAuthenticated}
              onLogin={login}
            />
          ))}
        </div>
      )}
    </div>
  );
}
