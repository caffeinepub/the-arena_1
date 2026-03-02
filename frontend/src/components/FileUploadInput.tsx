import React, { useRef, useState, useCallback } from 'react';
import { Upload, Music, Video, Image, Film, X, FileAudio, FileVideo } from 'lucide-react';

interface FileUploadInputProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  category?: 'audio' | 'video' | 'image' | 'media';
  label?: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CategoryIcon({ category, className }: { category: FileUploadInputProps['category']; className?: string }) {
  switch (category) {
    case 'audio': return <Music className={className} />;
    case 'video': return <Film className={className} />;
    case 'image': return <Image className={className} />;
    case 'media':
    default:
      return (
        <span className="flex gap-1 items-center">
          <FileAudio className={className} />
          <FileVideo className={className} />
        </span>
      );
  }
}

function FileTypeIcon({ file }: { file: File }) {
  const mime = file.type.toLowerCase();
  if (mime.startsWith('audio/')) return <Music className="w-5 h-5 text-arena-neon" />;
  if (mime.startsWith('video/')) return <Video className="w-5 h-5 text-arena-neon" />;
  if (mime.startsWith('image/')) return <Image className="w-5 h-5 text-arena-neon" />;
  return <Upload className="w-5 h-5 text-arena-neon" />;
}

export default function FileUploadInput({
  file,
  onFileChange,
  accept,
  category = 'media',
  label,
  className = '',
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFileChange(dropped);
    },
    [onFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0] ?? null;
      onFileChange(selected);
      // Reset input so same file can be re-selected
      e.target.value = '';
    },
    [onFileChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFileChange(null);
    },
    [onFileChange]
  );

  const defaultLabel =
    category === 'audio'
      ? 'Drop audio file here or click to browse'
      : category === 'video'
      ? 'Drop video file here or click to browse'
      : category === 'image'
      ? 'Drop image here or click to browse'
      : 'Drop audio or video file here or click to browse';

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label={label ?? defaultLabel}
      />

      {file ? (
        <div className="flex items-center gap-3 bg-arena-surface border border-arena-neon/40 rounded-xl px-4 py-3">
          <FileTypeIcon file={file} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex flex-col items-center justify-center gap-3 
            border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer
            transition-all duration-200 select-none
            ${dragging
              ? 'border-arena-neon bg-arena-neon/10 scale-[1.01]'
              : 'border-border hover:border-arena-neon/60 hover:bg-arena-surface/60 bg-arena-surface/30'
            }
          `}
        >
          <CategoryIcon
            category={category}
            className="w-8 h-8 text-arena-neon/70"
          />
          <div className="text-center">
            <p className="text-sm text-foreground font-medium">{label ?? defaultLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {category === 'audio' && 'MP3, WAV, AAC'}
              {category === 'video' && 'MP4, WebM, MOV'}
              {category === 'image' && 'JPG, PNG, WebP'}
              {category === 'media' && 'MP3, WAV, AAC · MP4, WebM, MOV'}
            </p>
          </div>
          <span className="text-xs text-arena-neon/80 border border-arena-neon/40 rounded-full px-3 py-1">
            Browse files
          </span>
        </div>
      )}
    </div>
  );
}
