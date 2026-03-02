import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useUploadContent } from '../hooks/useQueries';
import { FileType, ExternalBlob } from '../backend';
import FileUploadInput from '../components/FileUploadInput';
import ThumbnailCreator from '../components/ThumbnailCreator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Music, Video, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

function detectFileType(file: File): FileType | null {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime === 'audio/mpeg' || mime === 'audio/mp3' || name.endsWith('.mp3')) return FileType.audioMp3;
  if (mime === 'audio/wav' || mime === 'audio/x-wav' || name.endsWith('.wav')) return FileType.audioWav;
  // AAC mapped to audioMp3 as closest backend type
  if (mime === 'audio/aac' || mime === 'audio/x-aac' || name.endsWith('.aac')) return FileType.audioMp3;
  if (mime === 'video/mp4' || name.endsWith('.mp4')) return FileType.videoMP4;
  if (mime === 'video/webm' || name.endsWith('.webm')) return FileType.videoWebM;
  if (mime === 'video/quicktime' || name.endsWith('.mov')) return FileType.videoMov;
  return null;
}

function isAudioFileType(ft: FileType): boolean {
  return ft === FileType.audioMp3 || ft === FileType.audioWav;
}

async function fileToExternalBlob(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ExternalBlob> {
  const buf = await file.arrayBuffer();
  // Cast to ArrayBuffer to satisfy ExternalBlob.fromBytes type requirement
  const bytes = new Uint8Array(buf as ArrayBuffer);
  const blob = ExternalBlob.fromBytes(bytes);
  if (onProgress) return blob.withUploadProgress(onProgress);
  return blob;
}

export default function UploadPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const uploadContent = useUploadContent();

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  // Store thumbnail as ArrayBuffer to avoid Uint8Array generic variance issues
  const [thumbnailBuffer, setThumbnailBuffer] = useState<ArrayBuffer | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const detectedFileType = mediaFile ? detectFileType(mediaFile) : null;
  const isAudio = detectedFileType ? isAudioFileType(detectedFileType) : false;

  // ThumbnailCreator passes Uint8Array; store the underlying ArrayBuffer
  const handleThumbnailCapture = useCallback((bytes: Uint8Array) => {
    setThumbnailBuffer(bytes.buffer as ArrayBuffer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mediaFile) { setError('Please select a media file.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!detectedFileType) { setError('Unsupported file type. Please upload MP3, WAV, AAC, MP4, WebM, or MOV.'); return; }

    try {
      setUploadProgress(0);
      const contentBlob = await fileToExternalBlob(mediaFile, (pct) => setUploadProgress(pct));

      let thumbExternalBlob: ExternalBlob | null = null;
      if (thumbnailBuffer) {
        setThumbProgress(0);
        const thumbBytes = new Uint8Array(thumbnailBuffer);
        thumbExternalBlob = ExternalBlob.fromBytes(thumbBytes).withUploadProgress((pct) => setThumbProgress(pct));
      }

      let coverExternalBlob: ExternalBlob | null = null;
      if (albumCoverFile) {
        setCoverProgress(0);
        coverExternalBlob = await fileToExternalBlob(albumCoverFile, (pct) => setCoverProgress(pct));
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await uploadContent.mutateAsync({
        id,
        title: title.trim(),
        description: description.trim(),
        fileType: detectedFileType,
        contentBlob,
        thumbnailBlob: thumbExternalBlob,
        albumCoverBlob: coverExternalBlob,
      });

      setSuccess(true);
      setTimeout(() => navigate({ to: '/' }), 1500);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed. Please try again.');
    }
  };

  if (!identity) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-arena-surface flex items-center justify-center">
          <Lock className="w-8 h-8 text-arena-neon" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-display text-foreground mb-2">Login Required</h2>
          <p className="text-muted-foreground">You must be logged in to upload content.</p>
        </div>
        <Button
          onClick={() => navigate({ to: '/' })}
          variant="outline"
          className="border-arena-neon text-arena-neon hover:bg-arena-neon hover:text-arena-dark"
        >
          Back to Feed
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-arena-surface flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-arena-neon" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-display text-foreground mb-2">Upload Successful!</h2>
          <p className="text-muted-foreground">Redirecting to feed…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-foreground mb-1">Upload Content</h1>
        <p className="text-muted-foreground text-sm">Share your music or video with the Arena community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Media File */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <span className="flex gap-1">
              <Music className="w-4 h-4 text-arena-neon" />
              <Video className="w-4 h-4 text-arena-neon" />
            </span>
            Media File <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">Supported: MP3, WAV, AAC (audio) · MP4, WebM, MOV (video)</p>
          <FileUploadInput
            file={mediaFile}
            onFileChange={setMediaFile}
            accept=".mp3,.wav,.aac,.mp4,.webm,.mov,audio/mpeg,audio/wav,audio/x-wav,audio/aac,video/mp4,video/webm,video/quicktime"
            category="media"
            label="Drop your audio or video file here"
          />
          {mediaFile && detectedFileType === null && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Unsupported file type.
            </p>
          )}
          {mediaFile && detectedFileType && (
            <p className="text-xs text-arena-neon">
              Detected: {isAudio ? '🎵 Audio' : '🎬 Video'} ({detectedFileType})
            </p>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Uploading media… {uploadProgress}%</p>
              <Progress value={uploadProgress} className="h-1" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground font-semibold">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAudio ? 'Song or album title…' : 'Video title…'}
            className="bg-arena-surface border-border text-foreground placeholder:text-muted-foreground"
            maxLength={120}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground font-semibold">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isAudio ? 'About this track…' : 'About this video…'}
            className="bg-arena-surface border-border text-foreground placeholder:text-muted-foreground resize-none"
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Thumbnail */}
        {mediaFile && detectedFileType && (
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">
              Thumbnail {isAudio ? '(Album Art)' : '(Video Thumbnail)'}
            </Label>
            <ThumbnailCreator
              mediaFile={mediaFile}
              isAudio={isAudio}
              onThumbnailCapture={handleThumbnailCapture}
            />
            {thumbProgress > 0 && thumbProgress < 100 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uploading thumbnail… {thumbProgress}%</p>
                <Progress value={thumbProgress} className="h-1" />
              </div>
            )}
          </div>
        )}

        {/* Album Cover (audio only) */}
        {isAudio && (
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Album Cover (optional)</Label>
            <p className="text-xs text-muted-foreground">Upload a separate high-res album cover image.</p>
            <FileUploadInput
              file={albumCoverFile}
              onFileChange={setAlbumCoverFile}
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              category="image"
              label="Drop album cover image here"
            />
            {coverProgress > 0 && coverProgress < 100 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uploading cover… {coverProgress}%</p>
                <Progress value={coverProgress} className="h-1" />
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={uploadContent.isPending || !mediaFile || !title.trim()}
          className="w-full bg-arena-neon text-arena-dark font-bold hover:bg-arena-neon/90 disabled:opacity-50 h-12 text-base"
        >
          {uploadContent.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-arena-dark border-t-transparent rounded-full animate-spin" />
              Uploading…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Publish to Arena
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
