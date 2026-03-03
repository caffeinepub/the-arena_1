import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, Check, Image, Upload, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { captureVideoFrame } from "../utils/videoFrameCapture";

interface ThumbnailCreatorProps {
  mediaFile: File;
  isAudio: boolean;
  onThumbnailCapture: (bytes: Uint8Array) => void;
}

export default function ThumbnailCreator({
  mediaFile,
  isAudio,
  onThumbnailCapture,
}: ThumbnailCreatorProps) {
  const [mode, setMode] = useState<"capture" | "upload">("capture");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [seekTime, setSeekTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [_captured, setCaptured] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For audio, default to upload mode
  // biome-ignore lint/correctness/useExhaustiveDependencies: mediaFile identity change intentionally triggers reset
  useEffect(() => {
    if (isAudio) {
      setMode("upload");
    } else {
      setMode("capture");
    }
    setPreviewUrl(null);
    setCaptured(false);
  }, [isAudio, mediaFile]);

  // Load video source for frame capture
  useEffect(() => {
    if (!isAudio && mediaFile) {
      const url = URL.createObjectURL(mediaFile);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [isAudio, mediaFile]);

  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration || 0);
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const t = value[0];
    setSeekTime(t);
    if (videoRef.current) {
      videoRef.current.currentTime = t;
    }
  }, []);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const blob = await captureVideoFrame(videoRef.current);
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer as ArrayBuffer);
      onThumbnailCapture(bytes);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCaptured(true);
    } catch {
      // ignore
    }
  }, [onThumbnailCapture]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer as ArrayBuffer);
      onThumbnailCapture(bytes);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCaptured(true);
      e.target.value = "";
    },
    [onThumbnailCapture],
  );

  const handleClearPreview = useCallback(() => {
    setPreviewUrl(null);
    setCaptured(false);
  }, []);

  return (
    <div className="bg-arena-surface/50 border border-border rounded-xl p-4 space-y-4">
      {/* Mode tabs — only show for video */}
      {!isAudio && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("capture")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              mode === "capture"
                ? "border-arena-neon text-arena-neon bg-arena-neon/10"
                : "border-border text-muted-foreground hover:border-arena-neon/50"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Capture Frame
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              mode === "upload"
                ? "border-arena-neon text-arena-neon bg-arena-neon/10"
                : "border-border text-muted-foreground hover:border-arena-neon/50"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Image
          </button>
        </div>
      )}

      {/* Audio label */}
      {isAudio && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5 text-arena-neon" />
          Upload a thumbnail image for this track (optional)
        </p>
      )}

      {/* Video frame capture */}
      {!isAudio && mode === "capture" && videoSrc && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            src={videoSrc}
            onLoadedMetadata={handleVideoLoaded}
            className="w-full rounded-lg max-h-48 object-contain bg-black"
            muted
            playsInline
          />
          {videoDuration > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Seek to frame: {seekTime.toFixed(1)}s /{" "}
                {videoDuration.toFixed(1)}s
              </p>
              <Slider
                min={0}
                max={videoDuration}
                step={0.1}
                value={[seekTime]}
                onValueChange={handleSeek}
                className="w-full"
              />
            </div>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleCapture}
            className="bg-arena-neon text-arena-dark hover:bg-arena-neon/90 text-xs"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5" />
            Capture This Frame
          </Button>
        </div>
      )}

      {/* Image upload */}
      {(isAudio || mode === "upload") && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-xs text-arena-neon border border-arena-neon/40 rounded-lg px-4 py-2 hover:bg-arena-neon/10 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {isAudio ? "Upload Thumbnail Image" : "Upload Custom Thumbnail"}
          </button>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Thumbnail preview"
            className="w-32 h-32 object-cover rounded-lg border border-arena-neon/40"
          />
          <div className="absolute top-1 right-1 flex gap-1">
            <span className="bg-arena-neon/90 text-arena-dark rounded-full p-0.5">
              <Check className="w-3 h-3" />
            </span>
            <button
              type="button"
              onClick={handleClearPreview}
              className="bg-black/70 text-white rounded-full p-0.5 hover:bg-destructive/80 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
