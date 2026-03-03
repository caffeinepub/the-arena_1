import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  Heart,
  ListPlus,
  MessageCircle,
  Music,
  Trash2,
  Video,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { ContentMetadata } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddToQueue,
  useDeleteContent,
  useHasUserLikedContent,
  useToggleLike,
} from "../hooks/useQueries";
import ConfirmationDialog from "./ConfirmationDialog";

interface ContentCardProps {
  content: ContentMetadata;
  uploaderName?: string;
}

function isAudioMime(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

function getMimeLabel(mimeType: string): string {
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
  if (map[mimeType]) return map[mimeType];
  // Derive from mime subtype
  const sub = mimeType.split("/")[1];
  if (sub) return sub.toUpperCase().slice(0, 6);
  return "Media";
}

function getFileTypeBadge(mimeType: string) {
  const isAudio = isAudioMime(mimeType);
  const isVideo = isVideoMime(mimeType);
  const label = getMimeLabel(mimeType);

  if (isAudio) {
    return {
      label,
      icon: <Music className="w-3 h-3" />,
      color: "text-arena-neon border-arena-neon/50 bg-arena-neon/10",
    };
  }
  if (isVideo) {
    return {
      label,
      icon: <Video className="w-3 h-3" />,
      color: "text-blue-400 border-blue-400/50 bg-blue-400/10",
    };
  }
  return {
    label,
    icon: <Music className="w-3 h-3" />,
    color: "text-muted-foreground border-border bg-arena-surface",
  };
}

function getThumbnailUrl(content: ContentMetadata): string {
  if (content.thumbnailBlob) {
    return content.thumbnailBlob.getDirectURL();
  }
  if (content.albumCoverBlob) {
    return content.albumCoverBlob.getDirectURL();
  }
  if (isAudioMime(content.mimeType)) {
    return "/assets/generated/default-audio-thumb.dim_400x400.png";
  }
  return "/assets/generated/default-video-thumb.dim_400x400.png";
}

export default function ContentCard({
  content,
  uploaderName,
}: ContentCardProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const addToQueue = useAddToQueue();
  const toggleLike = useToggleLike();
  const deleteContent = useDeleteContent();
  const { data: isLiked } = useHasUserLikedContent(content.id);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const badge = getFileTypeBadge(content.mimeType);
  const thumbnailUrl = getThumbnailUrl(content);

  const isOwner = identity
    ? content.uploader.toString() === identity.getPrincipal().toString()
    : false;

  const handleCardClick = () => {
    navigate({ to: "/content/$id", params: { id: content.id } });
  };

  const handleUploaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({
      to: "/profile/$principal",
      params: { principal: content.uploader.toString() },
    });
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (identity) addToQueue.mutate(content.id);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (identity) toggleLike.mutate(content.id);
  };

  const handleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({
      to: "/content/$id",
      params: { id: content.id },
      hash: "comments",
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteContent.mutate(content.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        toast.success(`"${content.title}" deleted`);
      },
      onError: () => {
        toast.error("Failed to delete content. Please try again.");
      },
    });
  };

  return (
    <>
      <article
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleCardClick();
        }}
        className="group bg-arena-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:border-arena-neon/40 hover:shadow-neon transition-all duration-300"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-black">
          <img
            src={thumbnailUrl}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.currentTarget;
              target.src = isAudioMime(content.mimeType)
                ? "/assets/generated/default-audio-thumb.dim_400x400.png"
                : "/assets/generated/default-video-thumb.dim_400x400.png";
            }}
          />
          {/* File type badge */}
          <span
            className={`absolute top-2 left-2 flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5 ${badge.color}`}
          >
            {badge.icon}
            {badge.label}
          </span>
          {/* Views overlay */}
          <span className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white/80 bg-black/60 rounded-full px-2 py-0.5">
            <Eye className="w-3 h-3" />
            {Number(content.views).toLocaleString()}
          </span>
          {/* Delete button overlay (owner only) */}
          {isOwner && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleteContent.isPending}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/70 hover:bg-destructive/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-40"
              title="Delete content"
              aria-label="Delete content"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content info */}
        <div className="p-3 space-y-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-arena-neon transition-colors">
            {content.title}
          </h3>
          {uploaderName && (
            <button
              type="button"
              onClick={handleUploaderClick}
              className="text-xs text-muted-foreground hover:text-arena-neon transition-colors truncate block text-left w-full"
              title={`View ${uploaderName}'s profile`}
            >
              {uploaderName}
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pt-1">
            <button
              type="button"
              onClick={handleAddToQueue}
              disabled={!identity || addToQueue.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-arena-neon disabled:opacity-40 transition-colors px-2 py-1 rounded-lg hover:bg-arena-neon/10"
              title="Add to queue"
            >
              <ListPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleLike}
              disabled={!identity || toggleLike.isPending}
              className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-arena-neon/10 disabled:opacity-40 ${
                isLiked
                  ? "text-arena-neon"
                  : "text-muted-foreground hover:text-arena-neon"
              }`}
              title="Like"
            >
              <Heart
                className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`}
              />
              <span>{Number(content.likes)}</span>
            </button>
            <button
              type="button"
              onClick={handleComments}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-arena-neon transition-colors px-2 py-1 rounded-lg hover:bg-arena-neon/10"
              title="Comments"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{Number(content.comments)}</span>
            </button>
          </div>
        </div>
      </article>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Content"
        description={`Are you sure you want to permanently delete "${content.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isPending={deleteContent.isPending}
        destructive
      />
    </>
  );
}
