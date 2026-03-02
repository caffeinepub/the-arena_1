import { useState } from 'react';
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
import { Loader2, Upload, Lock } from 'lucide-react';
import { toast } from 'sonner';

function detectFileType(file: File): FileType | null {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (name.endsWith('.mp3') || mime === 'audio/mpeg') return FileType.audioMp3;
  if (name.endsWith('.wav') || mime === 'audio/wav' || mime === 'audio/x-wav') return FileType.audioWav;
  if (name.endsWith('.mp4') || mime === 'video/mp4') return FileType.videoMP4;
  if (name.endsWith('.webm') || mime === 'video/webm') return FileType.videoWebM;
  if (name.endsWith('.mov') || mime === 'video/quicktime') return FileType.videoMov;
  return null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function fileToExternalBlob(file: File): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { mutateAsync: uploadContent, isPending } = useUploadContent();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const detectedFileType = mediaFile ? detectFileType(mediaFile) : null;
  const isAudio = detectedFileType === FileType.audioMp3 || detectedFileType === FileType.audioWav;

  const handleMediaChange = (file: File | null) => {
    setMediaFile(file);
    setThumbnailFile(null);
    setAlbumCoverFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile || !detectedFileType || !title.trim()) return;

    try {
      setUploadProgress(0);

      const contentBytes = await fileToExternalBlob(mediaFile);
      const contentBlob = ExternalBlob.fromBytes(contentBytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      let thumbnailBlob: ExternalBlob | null = null;
      if (thumbnailFile) {
        const thumbBytes = await fileToExternalBlob(thumbnailFile);
        thumbnailBlob = ExternalBlob.fromBytes(thumbBytes);
      }

      let albumCoverBlob: ExternalBlob | null = null;
      if (albumCoverFile) {
        const coverBytes = await fileToExternalBlob(albumCoverFile);
        albumCoverBlob = ExternalBlob.fromBytes(coverBytes);
      }

      await uploadContent({
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        fileType: detectedFileType,
        contentBlob,
        thumbnailBlob,
        albumCoverBlob,
      });

      toast.success('Content uploaded to The Arena!');
      navigate({ to: '/' });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed. Please try again.');
      setUploadProgress(0);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-arena-neon/10 border border-arena-neon/30 flex items-center justify-center mb-6 neon-glow-sm">
          <Lock className="w-9 h-9 text-arena-neon" />
        </div>
        <h2 className="text-2xl font-display text-arena-neon neon-text mb-3">LOGIN REQUIRED</h2>
        <p className="text-muted-foreground max-w-sm">
          You need to log in to upload content to The Arena. Click the Login button in the header to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-4xl font-display text-arena-neon neon-text mb-2">UPLOAD TO THE ARENA</h1>
        <p className="text-muted-foreground">Share your AI-generated music and video with the world.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Media file */}
        <div className="bg-card border border-arena-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-arena-neon">Media File</h2>
          <FileUploadInput
            category={mediaFile && !isAudio ? 'video' : 'audio'}
            accept=".mp3,.wav,.mp4,.webm,.mov,audio/mpeg,audio/wav,audio/x-wav,video/mp4,video/webm,video/quicktime"
            label="Audio or Video File"
            hint="Supported: MP3, WAV, MP4, WebM, MOV"
            value={mediaFile}
            onChange={handleMediaChange}
            required
          />
          {mediaFile && !detectedFileType && (
            <p className="text-xs text-destructive">
              Unsupported file type. Please use MP3, WAV, MP4, WebM, or MOV.
            </p>
          )}
          {detectedFileType && (
            <p className="text-xs text-arena-neon font-semibold">
              ✓ Detected: {detectedFileType}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-card border border-arena-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-arena-neon">Details</h2>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground font-semibold">
              Title <span className="text-arena-neon">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your track or video a name..."
              className="bg-muted border-arena-border focus:border-arena-neon text-foreground placeholder:text-muted-foreground"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the world about your creation..."
              className="bg-muted border-arena-border focus:border-arena-neon text-foreground placeholder:text-muted-foreground resize-none"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        {/* Album cover (audio only) */}
        {isAudio && (
          <div className="bg-card border border-arena-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-arena-neon">Album Cover</h2>
            <FileUploadInput
              category="image"
              accept="image/png,image/jpeg,image/webp"
              label="Album Cover Image"
              hint="PNG, JPG, or WebP — recommended 1:1 ratio"
              value={albumCoverFile}
              onChange={setAlbumCoverFile}
            />
          </div>
        )}

        {/* Thumbnail */}
        {detectedFileType && (
          <div className="bg-card border border-arena-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-arena-neon">
              Thumbnail
            </h2>
            <ThumbnailCreator
              fileType={detectedFileType}
              mediaFile={mediaFile}
              onThumbnailChange={setThumbnailFile}
            />
          </div>
        )}

        {/* Upload progress */}
        {isPending && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading to The Arena...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending || !mediaFile || !detectedFileType || !title.trim()}
          className="w-full bg-arena-neon text-arena-darker font-bold text-base py-6 hover:bg-arena-neon-bright neon-glow disabled:opacity-50 disabled:neon-glow-sm transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload to The Arena
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
