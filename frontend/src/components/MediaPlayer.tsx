import { useRef, useEffect } from 'react';
import { type ExternalBlob, FileType } from '../backend';

interface MediaPlayerProps {
  contentBlob: ExternalBlob;
  fileType: FileType;
  albumCoverBlob?: ExternalBlob;
  title: string;
}

export default function MediaPlayer({ contentBlob, fileType, albumCoverBlob, title }: MediaPlayerProps) {
  const isAudio = fileType === FileType.audioMp3 || fileType === FileType.audioWav;
  const mediaUrl = contentBlob.getDirectURL();
  const albumCoverUrl = albumCoverBlob?.getDirectURL();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [mediaUrl]);

  if (isAudio) {
    return (
      <div className="w-full">
        {/* Album cover */}
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
          <div className="w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0 rounded-lg overflow-hidden border border-arena-border bg-arena-surface">
            <img
              src={albumCoverUrl || '/assets/generated/default-audio-thumb.dim_400x400.png'}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/assets/generated/default-audio-thumb.dim_400x400.png';
              }}
            />
          </div>
          <div className="flex-1 w-full">
            <div className="bg-arena-surface border border-arena-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Now Playing</p>
              <p className="text-foreground font-bold text-lg mb-4 line-clamp-2">{title}</p>
              <audio
                ref={audioRef}
                controls
                className="w-full"
                style={{ colorScheme: 'dark' }}
              >
                <source src={mediaUrl} />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-arena-border bg-black">
      <video
        controls
        className="w-full max-h-[70vh]"
        style={{ colorScheme: 'dark' }}
      >
        <source src={mediaUrl} />
        Your browser does not support the video element.
      </video>
    </div>
  );
}
