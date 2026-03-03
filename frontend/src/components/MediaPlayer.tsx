import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  Repeat, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
}

interface MediaPlayerProps {
  track: Track;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isRepeat: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  onPlayPause: () => void;
  onSeek: (value: number) => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onVolumeChange: (value: number) => void;
  onMuteToggle: () => void;
  onRepeatToggle: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

function PlayerControls({
  isPlaying, currentTime, duration, volume, isMuted, isRepeat,
  hasNext, hasPrev, onPlayPause, onSeek, onSkipBack, onSkipForward,
  onVolumeChange, onMuteToggle, onRepeatToggle, onNext, onPrev,
}: PlayerControlsProps) {
  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <span className="w-10 text-right">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-1.5 accent-arena-neon cursor-pointer"
        />
        <span className="w-10">{formatTime(duration)}</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Prev track */}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-2 rounded-full text-foreground/50 hover:text-foreground disabled:opacity-30 transition-colors"
          aria-label="Previous track"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Skip back 15s */}
        <button
          onClick={onSkipBack}
          className="p-2 rounded-full text-foreground/60 hover:text-foreground transition-colors"
          aria-label="Skip back 15 seconds"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="w-12 h-12 rounded-full bg-arena-neon text-arena-dark flex items-center justify-center shadow-neon hover:bg-arena-neon/90 transition-all"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Skip forward 15s */}
        <button
          onClick={onSkipForward}
          className="p-2 rounded-full text-foreground/60 hover:text-foreground transition-colors"
          aria-label="Skip forward 15 seconds"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        {/* Next track */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-2 rounded-full text-foreground/50 hover:text-foreground disabled:opacity-30 transition-colors"
          aria-label="Next track"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Volume + Repeat */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMuteToggle}
          className="p-1.5 text-foreground/50 hover:text-foreground transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="flex-1 h-1 accent-arena-neon cursor-pointer"
        />
        <button
          onClick={onRepeatToggle}
          className={`p-1.5 transition-colors ${isRepeat ? 'text-arena-neon' : 'text-foreground/40 hover:text-foreground'}`}
          aria-label="Toggle repeat"
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function MediaPlayer({
  track,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: MediaPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const isVideo = track.mimeType.startsWith('video/');

  const getMediaRef = useCallback(() => {
    return isVideo ? videoRef.current : audioRef.current;
  }, [isVideo]);

  // Reset state when track changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setMediaError(null);
  }, [track.id]);

  // Sync volume/mute to media element
  useEffect(() => {
    const el = getMediaRef();
    if (!el) return;
    el.volume = volume;
    el.muted = isMuted;
  }, [volume, isMuted, getMediaRef]);

  // Sync repeat to media element
  useEffect(() => {
    const el = getMediaRef();
    if (!el) return;
    el.loop = isRepeat;
  }, [isRepeat, getMediaRef]);

  const handlePlayPause = useCallback(() => {
    const el = getMediaRef();
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play().catch(() => {
        setMediaError('Unable to play this media. The format may not be supported by your browser.');
      });
    }
  }, [isPlaying, getMediaRef]);

  const handleSeek = useCallback((value: number) => {
    const el = getMediaRef();
    if (!el) return;
    el.currentTime = value;
    setCurrentTime(value);
  }, [getMediaRef]);

  const handleSkipBack = useCallback(() => {
    const el = getMediaRef();
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - 15);
  }, [getMediaRef]);

  const handleSkipForward = useCallback(() => {
    const el = getMediaRef();
    if (!el) return;
    el.currentTime = Math.min(el.duration || 0, el.currentTime + 15);
  }, [getMediaRef]);

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    setIsMuted(value === 0);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleRepeatToggle = useCallback(() => {
    setIsRepeat((prev) => !prev);
  }, []);

  // Shared event handlers for both audio and video elements
  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    setDuration(e.currentTarget.duration);
    setMediaError(null);
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (!isRepeat && onNext) {
      onNext();
    }
  }, [isRepeat, onNext]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    const mediaEl = e.currentTarget as HTMLMediaElement;
    const errCode = mediaEl.error?.code;
    let message = 'This media could not be played.';

    if (errCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      message =
        'This video format is not supported by your browser. Try a different browser (e.g. Chrome or Firefox) or convert the file to MP4/WebM.';
    } else if (errCode === MediaError.MEDIA_ERR_DECODE) {
      message =
        'The media file could not be decoded. The file may be corrupted or use an unsupported codec.';
    } else if (errCode === MediaError.MEDIA_ERR_NETWORK) {
      message = 'A network error occurred while loading the media. Please try again.';
    } else if (errCode === MediaError.MEDIA_ERR_ABORTED) {
      // User aborted — not an error worth showing
      return;
    }

    setMediaError(message);
    setIsPlaying(false);
  }, []);

  const sharedMediaProps = {
    src: track.url,
    onTimeUpdate: handleTimeUpdate,
    onLoadedMetadata: handleLoadedMetadata,
    onPlay: handlePlay,
    onPause: handlePause,
    onEnded: handleEnded,
    onError: handleError,
  };

  return (
    <div className="bg-arena-surface rounded-xl overflow-hidden shadow-lg">
      {/* Video element */}
      {isVideo && (
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            {...sharedMediaProps}
            className="w-full h-full object-contain"
            playsInline
          />
          {/* Video error overlay */}
          {mediaError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-destructive mb-3" />
              <p className="text-sm text-foreground/80 max-w-sm">{mediaError}</p>
            </div>
          )}
        </div>
      )}

      {/* Audio element (hidden) */}
      {!isVideo && (
        <audio ref={audioRef} {...sharedMediaProps} className="hidden" />
      )}

      {/* Audio thumbnail / album art */}
      {!isVideo && track.thumbnailUrl && (
        <div className="relative">
          <img
            src={track.thumbnailUrl}
            alt={track.title}
            className="w-full aspect-square object-cover"
          />
        </div>
      )}

      {/* Player info + controls */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
          <p className="text-xs text-foreground/40 mt-0.5 uppercase tracking-wide">
            {track.mimeType || 'Media'}
          </p>
        </div>

        {/* Audio error message (below title for audio) */}
        {!isVideo && mediaError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{mediaError}</p>
          </div>
        )}

        {/* Controls */}
        <PlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isRepeat={isRepeat}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onSkipBack={handleSkipBack}
          onSkipForward={handleSkipForward}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onRepeatToggle={handleRepeatToggle}
          onNext={onNext}
          onPrev={onPrev}
        />
      </div>
    </div>
  );
}
