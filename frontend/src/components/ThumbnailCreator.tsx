import { useRef, useState, useEffect } from 'react';
import { FileType } from '../backend';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import FileUploadInput from './FileUploadInput';
import { captureVideoFrame } from '../utils/videoFrameCapture';
import { toast } from 'sonner';

interface ThumbnailCreatorProps {
  fileType: FileType;
  mediaFile: File | null;
  onThumbnailChange: (file: File | null) => void;
}

export default function ThumbnailCreator({ fileType, mediaFile, onThumbnailChange }: ThumbnailCreatorProps) {
  const isAudio = fileType === FileType.audioMp3 || fileType === FileType.audioWav;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Create object URL for video preview
  useEffect(() => {
    if (!isAudio && mediaFile) {
      const url = URL.createObjectURL(mediaFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [mediaFile, isAudio]);

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleScrub = (value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    try {
      const blob = await captureVideoFrame(videoRef.current);
      const file = new File([blob], 'thumbnail.png', { type: 'image/png' });
      setThumbnailFile(file);
      onThumbnailChange(file);
      const previewUrl = URL.createObjectURL(blob);
      setThumbnailPreview(previewUrl);
      toast.success('Thumbnail captured!');
    } catch {
      toast.error('Failed to capture frame. Try seeking to a different position.');
    }
  };

  const handleImageUpload = (file: File | null) => {
    setThumbnailFile(file);
    onThumbnailChange(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    } else {
      setThumbnailPreview(null);
    }
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    onThumbnailChange(null);
  };

  if (isAudio) {
    return (
      <div className="space-y-4">
        <FileUploadInput
          category="image"
          accept="image/png,image/jpeg,image/webp"
          label="Thumbnail / Album Cover"
          hint="PNG, JPG, or WebP — recommended 1:1 ratio"
          value={thumbnailFile}
          onChange={handleImageUpload}
        />
        {thumbnailPreview && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-arena-border">
            <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={clearThumbnail}
              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Video thumbnail creator
  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-foreground">
        Thumbnail
        <span className="text-muted-foreground font-normal ml-2">(optional)</span>
      </label>

      {videoUrl && mediaFile ? (
        <div className="space-y-3">
          {/* Video preview */}
          <div className="relative rounded-lg overflow-hidden bg-black border border-arena-border">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full max-h-48 object-contain"
              onLoadedMetadata={handleVideoLoaded}
              muted
              playsInline
            />
          </div>

          {/* Scrubber */}
          {duration > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Seek to frame</span>
                <span>{currentTime.toFixed(1)}s / {duration.toFixed(1)}s</span>
              </div>
              <Slider
                min={0}
                max={duration}
                step={0.1}
                value={[currentTime]}
                onValueChange={handleScrub}
                className="w-full"
              />
            </div>
          )}

          {/* Capture button */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleCapture}
              variant="outline"
              size="sm"
              className="border-arena-neon/40 text-arena-neon hover:bg-arena-neon/10 hover:border-arena-neon"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture Frame
            </Button>
            <span className="text-xs text-muted-foreground">or</span>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload image
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  handleImageUpload(file);
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-arena-surface border border-dashed border-arena-border rounded-lg text-center text-sm text-muted-foreground">
          Select a video file above to enable thumbnail capture
        </div>
      )}

      {/* Thumbnail preview */}
      {thumbnailPreview && (
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-14 rounded overflow-hidden border border-arena-neon/30">
            <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-arena-neon">Thumbnail set</p>
            <p className="text-xs text-muted-foreground">{thumbnailFile?.name}</p>
          </div>
          <button
            type="button"
            onClick={clearThumbnail}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
