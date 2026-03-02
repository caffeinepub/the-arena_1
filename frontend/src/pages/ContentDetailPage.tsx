import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetContent, useIncrementViews } from '../hooks/useQueries';
import { FileType } from '../backend';
import MediaPlayer from '../components/MediaPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Heart, MessageCircle, Music, Video, Calendar } from 'lucide-react';

function formatDate(uploadTime: bigint): string {
  const ms = Number(uploadTime) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getFileTypeLabel(fileType: FileType): { label: string; isAudio: boolean } {
  const isAudio = fileType === FileType.audioMp3 || fileType === FileType.audioWav;
  const labels: Record<FileType, string> = {
    [FileType.audioMp3]: 'MP3',
    [FileType.audioWav]: 'WAV',
    [FileType.videoMP4]: 'MP4',
    [FileType.videoWebM]: 'WebM',
    [FileType.videoMov]: 'MOV',
  };
  return { label: labels[fileType] ?? 'Media', isAudio };
}

export default function ContentDetailPage() {
  const { id } = useParams({ from: '/content/$id' });
  const navigate = useNavigate();
  const { data: content, isLoading, error } = useGetContent(id);
  const { mutate: incrementViews } = useIncrementViews();

  // Fire-and-forget view increment
  useEffect(() => {
    if (content?.id) {
      incrementViews(content.id);
    }
  }, [content?.id]);

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
        <p className="text-destructive font-semibold mb-4">Content not found or failed to load.</p>
        <Button onClick={() => navigate({ to: '/' })} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
      </div>
    );
  }

  const { label, isAudio } = getFileTypeLabel(content.fileType);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <Button
        onClick={() => navigate({ to: '/' })}
        variant="ghost"
        size="sm"
        className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Feed
      </Button>

      {/* Media player */}
      <div className="mb-8">
        <MediaPlayer
          contentBlob={content.contentBlob}
          fileType={content.fileType}
          albumCoverBlob={content.albumCoverBlob}
          title={content.title}
        />
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
                ? 'bg-arena-neon/15 text-arena-neon border-arena-neon/40 hover:bg-arena-neon/20'
                : 'bg-blue-500/15 text-blue-300 border-blue-400/40 hover:bg-blue-500/20'
            }`}
            variant="outline"
          >
            {isAudio ? <Music className="w-3 h-3" /> : <Video className="w-3 h-3" />}
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
            <Heart className="w-4 h-4" />
            {content.likes.toString()} likes
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            {content.comments.toString()} comments
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(content.uploadTime)}
          </span>
        </div>

        {/* Uploader */}
        <div className="flex items-center gap-2 py-3 border-t border-arena-border">
          <div className="w-8 h-8 rounded-full bg-arena-neon/10 border border-arena-neon/30 flex items-center justify-center">
            <span className="text-arena-neon text-xs font-bold">
              {content.uploader.toString().slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Uploaded by</p>
            <p className="text-sm font-semibold text-foreground">
              {content.uploader.toString().slice(0, 12)}...
            </p>
          </div>
        </div>

        {/* Description */}
        {content.description && (
          <div className="bg-card border border-arena-border rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {content.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
