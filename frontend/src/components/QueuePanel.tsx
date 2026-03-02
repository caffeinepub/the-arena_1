import { useGetPlaybackQueue, useGetAllContent, useRemoveFromQueue, useMoveItemInQueue, useClearQueue } from '../hooks/useQueries';
import { FileType } from '../backend';
import { X, ChevronUp, ChevronDown, Trash2, ListMusic, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentlyPlayingContentId?: string;
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

export default function QueuePanel({ isOpen, onClose, currentlyPlayingContentId }: QueuePanelProps) {
  const navigate = useNavigate();
  const { data: queue = [], isLoading: queueLoading } = useGetPlaybackQueue();
  const { data: allContent = [] } = useGetAllContent();
  const { mutate: removeFromQueue, isPending: isRemoving } = useRemoveFromQueue();
  const { mutate: moveItem, isPending: isMoving } = useMoveItemInQueue();
  const { mutate: clearQueue, isPending: isClearing } = useClearQueue();

  // Build a map of content id -> metadata for quick lookup
  const contentMap = new Map(allContent.map((c) => [c.id, c]));

  const handleRemove = (index: number) => {
    removeFromQueue(index, {
      onError: () => toast.error('Failed to remove item from queue'),
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    moveItem({ fromIndex: index, toIndex: index - 1 }, {
      onError: () => toast.error('Failed to reorder queue'),
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= queue.length - 1) return;
    moveItem({ fromIndex: index, toIndex: index + 1 }, {
      onError: () => toast.error('Failed to reorder queue'),
    });
  };

  const handleClear = () => {
    clearQueue(undefined, {
      onSuccess: () => toast.success('Queue cleared'),
      onError: () => toast.error('Failed to clear queue'),
    });
  };

  const handlePlayItem = (contentId: string) => {
    navigate({ to: '/content/$id', params: { id: contentId } });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 sm:w-96 z-50 flex flex-col bg-arena-surface border-l border-arena-border shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-arena-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-arena-neon" />
            <h2 className="font-display text-lg text-arena-neon tracking-wide">QUEUE</h2>
            {queue.length > 0 && (
              <span className="text-xs bg-arena-neon/20 text-arena-neon border border-arena-neon/30 rounded-full px-2 py-0.5 font-bold">
                {queue.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isClearing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7 px-2"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {isClearing ? 'Clearing…' : 'Clear All'}
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Close queue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {queueLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-14 h-14 rounded bg-arena-border flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-arena-border rounded w-3/4" />
                    <div className="h-3 bg-arena-border rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
              <ListMusic className="w-12 h-12 text-arena-border" />
              <p className="text-muted-foreground text-sm">Your queue is empty.</p>
              <p className="text-muted-foreground text-xs">
                Add tracks or videos using the{' '}
                <span className="text-arena-neon font-semibold">+ Queue</span> button on any content.
              </p>
            </div>
          ) : (
            <ul className="p-3 space-y-2">
              {queue.map((contentId, index) => {
                const content = contentMap.get(contentId);
                const isPlaying = contentId === currentlyPlayingContentId;
                const { label, isAudio } = content
                  ? getFileTypeBadge(content.fileType)
                  : { label: 'Media', isAudio: true };

                const thumbnailUrl = content?.thumbnailBlob
                  ? content.thumbnailBlob.getDirectURL()
                  : content?.albumCoverBlob
                  ? content.albumCoverBlob.getDirectURL()
                  : isAudio
                  ? '/assets/generated/default-audio-thumb.dim_400x400.png'
                  : '/assets/generated/default-video-thumb.dim_400x400.png';

                return (
                  <li
                    key={`${contentId}-${index}`}
                    className={`group flex items-center gap-3 p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                      isPlaying
                        ? 'border-arena-neon/60 bg-arena-neon/10 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                        : 'border-arena-border bg-card hover:border-arena-neon/30 hover:bg-arena-neon/5'
                    }`}
                    onClick={() => handlePlayItem(contentId)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-arena-surface">
                      <img
                        src={thumbnailUrl}
                        alt={content?.title ?? 'Unknown'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = isAudio
                            ? '/assets/generated/default-audio-thumb.dim_400x400.png'
                            : '/assets/generated/default-video-thumb.dim_400x400.png';
                        }}
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-arena-neon/20 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-arena-neon flex items-center justify-center">
                            <svg className="w-2 h-2 text-arena-darker ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight ${isPlaying ? 'text-arena-neon' : 'text-foreground'}`}>
                        {content?.title ?? contentId.slice(0, 12) + '…'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded font-bold ${
                            isAudio
                              ? 'bg-arena-neon/15 text-arena-neon border border-arena-neon/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-400/30'
                          }`}
                        >
                          {isAudio ? <Music className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
                          {label}
                        </span>
                        {isPlaying && (
                          <span className="text-xs text-arena-neon font-semibold">Now Playing</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || isMoving}
                        className="p-1 rounded text-muted-foreground hover:text-arena-neon hover:bg-arena-neon/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index >= queue.length - 1 || isMoving}
                        className="p-1 rounded text-muted-foreground hover:text-arena-neon hover:bg-arena-neon/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(index)}
                        disabled={isRemoving}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
