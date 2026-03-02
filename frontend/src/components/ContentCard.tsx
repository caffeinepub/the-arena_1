import { useNavigate } from '@tanstack/react-router';
import { type ContentMetadata, FileType } from '../backend';
import { Eye, Heart, Music, Video, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContentCardProps {
  content: ContentMetadata;
  uploaderName?: string;
}

function getFileTypeBadge(fileType: FileType) {
  const isAudio = fileType === FileType.audioMp3 || fileType === FileType.audioWav;
  const label = {
    [FileType.audioMp3]: 'MP3',
    [FileType.audioWav]: 'WAV',
    [FileType.videoMP4]: 'MP4',
    [FileType.videoWebM]: 'WebM',
    [FileType.videoMov]: 'MOV',
  }[fileType] ?? 'Media';

  return { label, isAudio };
}

function formatTime(uploadTime: bigint): string {
  const ms = Number(uploadTime) / 1_000_000;
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function ContentCard({ content, uploaderName }: ContentCardProps) {
  const navigate = useNavigate();
  const { label, isAudio } = getFileTypeBadge(content.fileType);

  const thumbnailUrl = content.thumbnailBlob
    ? content.thumbnailBlob.getDirectURL()
    : content.albumCoverBlob
    ? content.albumCoverBlob.getDirectURL()
    : isAudio
    ? '/assets/generated/default-audio-thumb.dim_400x400.png'
    : '/assets/generated/default-video-thumb.dim_400x400.png';

  return (
    <article
      onClick={() => navigate({ to: '/content/$id', params: { id: content.id } })}
      className="group cursor-pointer bg-card border border-arena-border rounded-lg overflow-hidden card-hover"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-arena-surface overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={content.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget;
            target.src = isAudio
              ? '/assets/generated/default-audio-thumb.dim_400x400.png'
              : '/assets/generated/default-video-thumb.dim_400x400.png';
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* File type badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
              isAudio
                ? 'bg-arena-neon/20 text-arena-neon border border-arena-neon/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
            }`}
          >
            {isAudio ? <Music className="w-3 h-3" /> : <Video className="w-3 h-3" />}
            {label}
          </span>
        </div>

        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-arena-neon/90 flex items-center justify-center neon-glow">
            <svg className="w-5 h-5 text-arena-darker ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 mb-1 group-hover:text-arena-neon transition-colors">
          {content.title}
        </h3>
        {uploaderName && (
          <p className="text-xs text-muted-foreground font-medium mb-2">{uploaderName}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {content.views.toString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {content.likes.toString()}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(content.uploadTime)}
          </span>
        </div>
      </div>
    </article>
  );
}
