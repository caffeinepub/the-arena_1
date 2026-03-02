import { useRef, useEffect, useState, useCallback } from 'react';
import { type ExternalBlob, FileType } from '../backend';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  SkipForward as NextTrack,
} from 'lucide-react';

interface MediaPlayerProps {
  contentBlob: ExternalBlob;
  fileType: FileType;
  albumCoverBlob?: ExternalBlob;
  title: string;
  onPlayNext?: () => void;
  hasNext?: boolean;
}

interface ControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLoading: boolean;
  isRepeat: boolean;
  isMuted: boolean;
  volume: number;
  hasNext: boolean;
  onPlayNext?: () => void;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayerControls({
  currentTime,
  duration,
  isPlaying,
  isLoading,
  isRepeat,
  isMuted,
  volume,
  hasNext,
  onPlayNext,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleRepeat,
}: ControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1 h-1.5 group">
          <div className="absolute inset-0 rounded-full bg-arena-border overflow-hidden">
            <div
              className="h-full bg-arena-neon transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={onSeek}
            disabled={isLoading || !duration}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Seek"
          />
        </div>
        <span className="text-xs text-muted-foreground w-10 tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      {/* Buttons row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: repeat */}
        <button
          onClick={onToggleRepeat}
          title={isRepeat ? 'Repeat: On' : 'Repeat: Off'}
          className={`p-2 rounded-full transition-all duration-200 ${
            isRepeat
              ? 'text-arena-neon drop-shadow-[0_0_6px_rgba(212,175,55,0.8)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Toggle repeat"
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Center: skip back, play/pause, skip forward, next */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSkipBack}
            disabled={isLoading}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Skip back 15s"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayPause}
            disabled={isLoading}
            className="w-11 h-11 rounded-full bg-arena-neon text-arena-darker flex items-center justify-center neon-glow hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={onSkipForward}
            disabled={isLoading}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Skip forward 15s"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Next track button */}
          {(hasNext || onPlayNext) && (
            <button
              onClick={onPlayNext}
              disabled={!hasNext || !onPlayNext}
              title="Next in Queue"
              className={`p-2 rounded-full transition-all duration-200 ${
                hasNext && onPlayNext
                  ? 'text-arena-neon hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.8)]'
                  : 'text-muted-foreground/30 cursor-not-allowed'
              }`}
              aria-label="Next track"
            >
              <NextTrack className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: volume */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="relative w-20 h-1.5 group hidden sm:block">
            <div className="absolute inset-0 rounded-full bg-arena-border overflow-hidden">
              <div
                className="h-full bg-arena-neon/70 transition-all duration-100"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={onVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MediaPlayer({
  contentBlob,
  fileType,
  albumCoverBlob,
  title,
  onPlayNext,
  hasNext = false,
}: MediaPlayerProps) {
  const isAudio = fileType === FileType.audioMp3 || fileType === FileType.audioWav;
  const mediaUrl = contentBlob.getDirectURL();
  const albumCoverUrl = albumCoverBlob?.getDirectURL();

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get the active media element
  const getEl = useCallback((): HTMLAudioElement | HTMLVideoElement | null => {
    return isAudio ? audioRef.current : videoRef.current;
  }, [isAudio]);

  // Set src on the active element when mediaUrl changes
  useEffect(() => {
    const el = getEl();
    if (!el) return;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
    el.src = mediaUrl;
    el.load();
  }, [mediaUrl, getEl]);

  // Sync loop attribute with repeat state
  useEffect(() => {
    const el = getEl();
    if (!el) return;
    el.loop = isRepeat;
  }, [isRepeat, getEl]);

  // Sync volume/mute
  useEffect(() => {
    const el = getEl();
    if (!el) return;
    el.volume = volume;
    el.muted = isMuted;
  }, [volume, isMuted, getEl]);

  const handlePlayPause = useCallback(async () => {
    const el = getEl();
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      try {
        await el.play();
      } catch (err) {
        console.error('Playback error:', err);
        setError('Unable to play media. Please try again.');
      }
    }
  }, [isPlaying, getEl]);

  const handleSkipBack = useCallback(() => {
    const el = getEl();
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - 15);
  }, [getEl]);

  const handleSkipForward = useCallback(() => {
    const el = getEl();
    if (!el) return;
    el.currentTime = Math.min(el.duration || 0, el.currentTime + 15);
  }, [getEl]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const el = getEl();
    if (!el) return;
    const val = parseFloat(e.target.value);
    el.currentTime = val;
    setCurrentTime(val);
  }, [getEl]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat((prev) => !prev);
  }, []);

  // Media element event handlers
  const onPlay = useCallback(() => setIsPlaying(true), []);
  const onPause = useCallback(() => setIsPlaying(false), []);

  const onEnded = useCallback(() => {
    if (!isRepeat) {
      setIsPlaying(false);
      if (onPlayNext) {
        onPlayNext();
      }
    }
  }, [isRepeat, onPlayNext]);

  const onTimeUpdate = useCallback(() => {
    const el = getEl();
    if (el) setCurrentTime(el.currentTime);
  }, [getEl]);

  const onLoadedMetadata = useCallback(() => {
    const el = getEl();
    if (el) {
      setDuration(el.duration);
      setIsLoading(false);
    }
  }, [getEl]);

  const onCanPlay = useCallback(() => setIsLoading(false), []);
  const onWaiting = useCallback(() => setIsLoading(true), []);
  const onError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load media. The file may be unavailable.');
  }, []);

  const controlsProps: ControlsProps = {
    currentTime,
    duration,
    isPlaying,
    isLoading,
    isRepeat,
    isMuted,
    volume,
    hasNext,
    onPlayNext,
    onPlayPause: handlePlayPause,
    onSkipBack: handleSkipBack,
    onSkipForward: handleSkipForward,
    onSeek: handleSeek,
    onVolumeChange: handleVolumeChange,
    onToggleMute: toggleMute,
    onToggleRepeat: toggleRepeat,
  };

  const sharedAudioProps = {
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onLoadedMetadata,
    onCanPlay,
    onWaiting,
    onError,
    preload: 'metadata' as const,
  };

  if (isAudio) {
    return (
      <div className="bg-card border border-arena-border rounded-xl p-5 flex flex-col gap-5">
        {/* Hidden audio element */}
        <audio ref={audioRef} {...sharedAudioProps} />

        {/* Album art + title */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-arena-surface border border-arena-border flex-shrink-0">
            {albumCoverUrl ? (
              <img src={albumCoverUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-arena-neon/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Now Playing</p>
            <h3 className="font-bold text-foreground text-lg leading-tight truncate">{title}</h3>
          </div>
        </div>

        {error && (
          <p className="text-destructive text-sm text-center">{error}</p>
        )}

        <PlayerControls {...controlsProps} />
      </div>
    );
  }

  // Video player
  return (
    <div className="bg-card border border-arena-border rounded-xl overflow-hidden flex flex-col">
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          {...sharedAudioProps}
          className="w-full h-full object-contain"
          playsInline
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <svg className="w-10 h-10 text-arena-neon animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h3 className="font-bold text-foreground text-base leading-tight truncate">{title}</h3>
        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}
        <PlayerControls {...controlsProps} />
      </div>
    </div>
  );
}
