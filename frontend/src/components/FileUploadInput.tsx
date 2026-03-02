import { useRef, useState, useCallback } from 'react';
import { Upload, X, FileAudio, FileVideo, Image } from 'lucide-react';

type FileCategory = 'audio' | 'video' | 'image';

interface FileUploadInputProps {
  category: FileCategory;
  accept: string;
  label: string;
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}

const categoryConfig: Record<FileCategory, { icon: React.ReactNode; color: string }> = {
  audio: {
    icon: <FileAudio className="w-8 h-8" />,
    color: 'text-arena-neon',
  },
  video: {
    icon: <FileVideo className="w-8 h-8" />,
    color: 'text-blue-400',
  },
  image: {
    icon: <Image className="w-8 h-8" />,
    color: 'text-purple-400',
  },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploadInput({
  category,
  accept,
  label,
  hint,
  value,
  onChange,
  required,
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const config = categoryConfig[category];

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onChange(file);
    },
    [onChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-arena-neon ml-1">*</span>}
      </label>

      {value ? (
        <div className="flex items-center gap-3 p-3 bg-arena-surface border border-arena-neon/30 rounded-lg">
          <div className={`flex-shrink-0 ${config.color}`}>{config.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative cursor-pointer border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            isDragging
              ? 'border-arena-neon bg-arena-neon/5 neon-glow-sm'
              : 'border-arena-border hover:border-arena-neon/50 hover:bg-arena-surface/50'
          }`}
        >
          <div className={`flex justify-center mb-2 ${config.color} opacity-60`}>{config.icon}</div>
          <p className="text-sm font-semibold text-foreground mb-1">
            Drop file here or <span className="text-arena-neon">browse</span>
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
