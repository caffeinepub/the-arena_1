import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  ListPlus,
  MessageCircle,
  Music,
  Trash2,
  User,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CommentsSection from "../components/CommentsSection";
import ConfirmationDialog from "../components/ConfirmationDialog";
import MediaPlayer from "../components/MediaPlayer";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddToQueue,
  useDeleteContent,
  useGetContent,
  useGetPlaybackQueue,
  useGetUserProfile,
  useHasUserLikedContent,
  useIncrementViews,
  useToggleLike,
} from "../hooks/useQueries";

function formatDate(uploadTime: bigint): string {
  const ms = Number(uploadTime) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getMimeInfo(mimeType: string): { label: string; isAudio: boolean } {
  const isAudio = mimeType.startsWith("audio/");
  const map: Record<string, string> = {
    "audio/mpeg": "MP3",
    "audio/mp3": "MP3",
    "audio/wav": "WAV",
    "audio/x-wav": "WAV",
    "audio/aac": "AAC",
    "audio/ogg": "OGG",
    "audio/flac": "FLAC",
    "video/mp4": "MP4",
    "video/webm": "WebM",
    "video/quicktime": "MOV",
    "video/x-msvideo": "AVI",
    "video/x-matroska": "MKV",
    "video/x-flv": "FLV",
    "video/x-ms-wmv": "WMV",
  };
  const label =
    map[mimeType] ??
    mimeType.split("/")[1]?.toUpperCase().slice(0, 6) ??
    "Media";
  return { label, isAudio };
}

export default function ContentDetailPage() {
  const { id } = useParams({ from: "/content/$id" });
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { data: content, isLoading, error } = useGetContent(id);
  const { mutate: incrementViews } = useIncrementViews();
  const { mutate: addToQueue, isPending: isAddingToQueue } = useAddToQueue();
  const { mutate: toggleLike, isPending: isTogglingLike } = useToggleLike();
  const { data: hasLiked = false } = useHasUserLikedContent(id);
  const { data: queue = [] } = useGetPlaybackQueue();
  const { mutate: deleteContent, isPending: isDeletingContent } =
    useDeleteContent();

  // Fetch uploader's profile for display name
  const { data: uploaderProfile, isLoading: isUploaderLoading } =
    useGetUserProfile(content?.uploader);

  const [showComments, setShowComments] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  // Fire-and-forget view increment
  // biome-ignore lint/correctness/useExhaustiveDependencies: incrementViews is a stable mutate fn; intentionally excluded
  useEffect(() => {
    if (content?.id) {
      incrementViews(content.id);
    }
  }, [content?.id]);

  // Auto-open comments if URL hash is #comments
  useEffect(() => {
    if (window.location.hash === "#comments") {
      setShowComments(true);
      setTimeout(() => {
        commentsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }, []);

  // Find the next content ID in the queue after the current one
  const currentQueueIndex = queue.indexOf(id);
  const nextContentId =
    currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1
      ? queue[currentQueueIndex + 1]
      : null;

  const isOwner =
    identity && content
      ? content.uploader.toString() === identity.getPrincipal().toString()
      : false;

  const handlePlayNext = () => {
    if (nextContentId) {
      navigate({ to: "/content/$id", params: { id: nextContentId } });
    }
  };

  const handleAddToQueue = () => {
    if (!content) return;
    addToQueue(content.id, {
      onSuccess: () => toast.success(`"${content.title}" added to queue`),
      onError: () => toast.error("Failed to add to queue"),
    });
  };

  const handleLike = () => {
    if (!identity) {
      toast.info("Please log in to like content");
      login();
      return;
    }
    toggleLike(id, {
      onError: () => toast.error("Failed to update like"),
    });
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) {
      setTimeout(() => {
        commentsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleConfirmDelete = () => {
    if (!content) return;
    deleteContent(content.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        toast.success(`"${content.title}" deleted`);
        navigate({ to: "/" });
      },
      onError: () => {
        toast.error("Failed to delete content. Please try again.");
      },
    });
  };

  const handleUploaderClick = () => {
    if (!content) return;
    navigate({
      to: "/profile/$principal",
      params: { principal: content.uploader.toString() },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-32 bg-arena-surface" />
        <Skeleton className="aspect-video w-full bg-arena-surface rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3 bg-arena-surface" />
          <Skeleton className="h-4 w-1/3 bg-arena-surface" />
          <Skeleton className="h-20 w-full bg-arena-surface" />
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-destructive font-semibold mb-4">
          Content not found or failed to load.
        </p>
        <Button onClick={() => navigate({ to: "/" })} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
      </div>
    );
  }

  const { label, isAudio } = getMimeInfo(content.mimeType);

  // Resolve uploader display name
  const uploaderDisplayName =
    uploaderProfile?.name ?? `${content.uploader.toString().slice(0, 8)}…`;

  // Avatar initials: use first letter of name if available, else first 2 chars of principal
  const avatarInitials = uploaderProfile?.name
    ? uploaderProfile.name.slice(0, 2).toUpperCase()
    : content.uploader.toString().slice(0, 2).toUpperCase();

  // Build the track object for MediaPlayer
  const track = {
    id: content.id,
    title: content.title,
    mimeType: content.mimeType,
    url: content.contentBlob.getDirectURL(),
    thumbnailUrl:
      content.albumCoverBlob?.getDirectURL() ??
      content.thumbnailBlob?.getDirectURL(),
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <Button
          onClick={() => navigate({ to: "/" })}
          variant="ghost"
          size="sm"
          className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>

        {/* Media player */}
        <div className="mb-6">
          <MediaPlayer
            track={track}
            onNext={nextContentId ? handlePlayNext : undefined}
            hasNext={!!nextContentId}
          />
        </div>

        {/* Action buttons row */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          {/* Add to Queue */}
          <Button
            onClick={handleAddToQueue}
            disabled={isAddingToQueue}
            variant="outline"
            size="sm"
            className="border-arena-neon/40 text-arena-neon hover:bg-arena-neon/10 hover:border-arena-neon/70 transition-all"
          >
            <ListPlus className="w-4 h-4 mr-2" />
            {isAddingToQueue ? "Adding…" : "Add to Queue"}
          </Button>

          {/* Like button */}
          <Button
            onClick={handleLike}
            disabled={isTogglingLike}
            variant="outline"
            size="sm"
            className={`transition-all border ${
              hasLiked
                ? "border-red-500/60 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/80"
                : "border-arena-border text-muted-foreground hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10"
            }`}
          >
            <Heart
              className={`w-4 h-4 mr-2 transition-all duration-200 ${
                hasLiked ? "fill-red-400 text-red-400" : ""
              }`}
            />
            {isTogglingLike ? "Updating…" : hasLiked ? "Liked" : "Like"}
          </Button>

          {/* Comments toggle button */}
          <Button
            onClick={handleToggleComments}
            variant="outline"
            size="sm"
            aria-expanded={showComments}
            aria-controls="comments-section"
            className={`transition-all border ${
              showComments
                ? "border-arena-neon/60 text-arena-neon bg-arena-neon/10 hover:bg-arena-neon/20 hover:border-arena-neon/80"
                : "border-arena-border text-muted-foreground hover:border-arena-neon/40 hover:text-arena-neon hover:bg-arena-neon/5"
            }`}
          >
            <MessageCircle
              className={`w-4 h-4 mr-2 transition-all duration-200 ${
                showComments ? "fill-arena-neon/20 text-arena-neon" : ""
              }`}
            />
            {showComments
              ? "Hide Comments"
              : `Comments (${content.comments.toString()})`}
          </Button>

          {/* Delete Content button (owner only) */}
          {isOwner && (
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeletingContent}
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/70 transition-all ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeletingContent ? "Deleting…" : "Delete Content"}
            </Button>
          )}
        </div>

        {/* Content info */}
        <div className="space-y-4">
          {/* Title + badge */}
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex-1 leading-tight">
              {content.title}
            </h1>
            <Badge
              className={`flex-shrink-0 flex items-center gap-1 font-bold ${
                isAudio
                  ? "bg-arena-neon/15 text-arena-neon border-arena-neon/40 hover:bg-arena-neon/20"
                  : "bg-blue-500/15 text-blue-300 border-blue-400/40 hover:bg-blue-500/20"
              }`}
              variant="outline"
            >
              {isAudio ? (
                <Music className="w-3 h-3" />
              ) : (
                <Video className="w-3 h-3" />
              )}
              {label}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {content.views.toString()} views
            </span>
            <span className="flex items-center gap-1.5">
              <Heart
                className={`w-4 h-4 ${hasLiked ? "fill-red-400 text-red-400" : ""}`}
              />
              {content.likes.toString()} likes
            </span>
            <button
              type="button"
              onClick={handleToggleComments}
              aria-expanded={showComments}
              aria-controls="comments-section"
              className={`flex items-center gap-1.5 transition-colors hover:text-arena-neon ${
                showComments ? "text-arena-neon" : ""
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              {content.comments.toString()} comments
            </button>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(content.uploadTime)}
            </span>
          </div>

          {/* Uploader */}
          <div className="flex items-center gap-2 py-3 border-t border-arena-border">
            <button
              type="button"
              onClick={handleUploaderClick}
              className="flex items-center gap-3 group/uploader"
              title={`View ${uploaderDisplayName}'s profile`}
            >
              <div className="w-9 h-9 rounded-full bg-arena-neon/10 border border-arena-neon/30 flex items-center justify-center flex-shrink-0 group-hover/uploader:border-arena-neon/60 transition-colors">
                {isUploaderLoading ? (
                  <User className="w-4 h-4 text-arena-neon/50" />
                ) : (
                  <span className="text-arena-neon text-xs font-bold">
                    {avatarInitials}
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Uploaded by</p>
                {isUploaderLoading ? (
                  <Skeleton className="h-4 w-24 bg-arena-surface mt-0.5" />
                ) : (
                  <p className="text-sm font-semibold text-foreground group-hover/uploader:text-arena-neon transition-colors">
                    {uploaderDisplayName}
                  </p>
                )}
              </div>
            </button>
          </div>

          {/* Description */}
          {content.description && (
            <div className="bg-card border border-arena-border rounded-lg p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {content.description}
              </p>
            </div>
          )}

          {/* Next in queue banner */}
          {nextContentId && (
            <div className="bg-arena-surface border border-arena-neon/20 rounded-lg p-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                <span className="text-arena-neon font-semibold">
                  Next in queue
                </span>{" "}
                — ready to play
              </p>
              <Button
                onClick={handlePlayNext}
                size="sm"
                variant="ghost"
                className="text-arena-neon hover:bg-arena-neon/10 text-xs h-7 px-3"
              >
                Play Next
              </Button>
            </div>
          )}

          {/* Comments section */}
          {showComments && (
            <div id="comments-section" ref={commentsSectionRef}>
              <CommentsSection contentId={id} />
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Content"
        description={`Are you sure you want to permanently delete "${content.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isPending={isDeletingContent}
        destructive
      />
    </>
  );
}
