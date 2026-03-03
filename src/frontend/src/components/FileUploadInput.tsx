import { File, FileAudio, FileVideo, Image, Upload, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

type FileCategory = "audio" | "video" | "image" | "media" | "any";

interface FileUploadInputProps {
  category: FileCategory;
  label: string;
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  className?: string;
}

function getFileIcon(category: FileCategory, file?: File | null) {
  if (file) {
    const mime = file.type || "";
    if (mime.startsWith("video/"))
      return <FileVideo className="w-8 h-8 text-arena-neon" />;
    if (mime.startsWith("audio/"))
      return <FileAudio className="w-8 h-8 text-arena-neon" />;
    if (mime.startsWith("image/"))
      return <Image className="w-8 h-8 text-arena-neon" />;
    return <File className="w-8 h-8 text-arena-neon" />;
  }
  switch (category) {
    case "audio":
      return <FileAudio className="w-8 h-8 text-arena-neon" />;
    case "video":
      return <FileVideo className="w-8 h-8 text-arena-neon" />;
    case "image":
      return <Image className="w-8 h-8 text-arena-neon" />;
    default:
      return <Upload className="w-8 h-8 text-arena-neon" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getHintText(category: FileCategory): string {
  switch (category) {
    case "audio":
      return "All audio formats supported (MP3, WAV, FLAC, AAC, OGG, etc.)";
    case "video":
      return "All video formats supported (MP4, MKV, AVI, MOV, WebM, FLV, WMV, etc.)";
    case "image":
      return "All image formats supported (JPG, PNG, GIF, WebP, etc.)";
    case "media":
      return "All audio and video formats supported";
    default:
      return "All file formats supported — no size limits";
  }
}

export default function FileUploadInput({
  category,
  label,
  onFileSelect,
  selectedFile,
  className = "",
}: FileUploadInputProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    onFileSelect(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  return (
    <div className={className}>
      <p className="block text-sm font-medium text-foreground/80 mb-2">
        {label}
      </p>
      {/* Hidden file input — no accept restriction, no size limit */}
      <input
        id="file-upload-input"
        type="file"
        accept="*"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Label is the drop zone — clicking it natively activates the associated input */}
      <label
        htmlFor="file-upload-input"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-200 block
          ${
            isDragging
              ? "border-arena-neon bg-arena-neon/10"
              : "border-arena-surface hover:border-arena-neon/50 bg-arena-surface/30 hover:bg-arena-surface/50"
          }
        `}
      >
        {selectedFile ? (
          <div className="flex items-center gap-4">
            {getFileIcon(category, selectedFile)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-foreground/50 mt-0.5">
                {formatFileSize(selectedFile.size)}
                {selectedFile.type && (
                  <span className="ml-2 text-arena-neon/70">
                    {selectedFile.type}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-arena-surface text-foreground/50 hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            {getFileIcon(category)}
            <div>
              <p className="text-sm font-medium text-foreground/80">
                Drop your file here or{" "}
                <span className="text-arena-neon">browse</span>
              </p>
              <p className="text-xs text-foreground/40 mt-1">
                {getHintText(category)}
              </p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}
