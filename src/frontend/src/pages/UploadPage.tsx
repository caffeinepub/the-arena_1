import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Music, Upload, Video } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { ExternalBlob } from "../backend";
import FileUploadInput from "../components/FileUploadInput";
import ThumbnailCreator from "../components/ThumbnailCreator";
import { useUploadContent } from "../hooks/useQueries";
import { GENRES, type Genre, prependGenre } from "../utils/genres";

type ContentCategory = "audio" | "video";

export default function UploadPage() {
  const navigate = useNavigate();
  const uploadContent = useUploadContent();

  const [category, setCategory] = useState<ContentCategory>("audio");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailBuffer, setThumbnailBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [albumCoverBuffer, setAlbumCoverBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const isAudio = category === "audio";

  const handleAlbumCoverSelect = async (file: File | null) => {
    setAlbumCoverFile(file);
    if (file) {
      const buf = await file.arrayBuffer();
      setAlbumCoverBuffer(buf);
    } else {
      setAlbumCoverBuffer(null);
    }
  };

  const handleThumbnailCapture = (bytes: Uint8Array) => {
    setThumbnailBuffer(bytes.buffer as ArrayBuffer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!selectedGenre) {
      setError("Please select a genre.");
      return;
    }
    if (!mediaFile) {
      setError("Please select a media file.");
      return;
    }

    try {
      const contentBytes = await mediaFile.arrayBuffer();
      const mimeType = mediaFile.type || (isAudio ? "audio/mpeg" : "video/mp4");

      let contentBlob = ExternalBlob.fromBytes(new Uint8Array(contentBytes));
      contentBlob = contentBlob.withUploadProgress((pct) =>
        setUploadProgress(pct),
      );

      const thumbnailBlob = thumbnailBuffer
        ? ExternalBlob.fromBytes(new Uint8Array(thumbnailBuffer as ArrayBuffer))
        : null;

      const albumCoverBlob = albumCoverBuffer
        ? ExternalBlob.fromBytes(
            new Uint8Array(albumCoverBuffer as ArrayBuffer),
          )
        : null;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const finalDescription = selectedGenre
        ? prependGenre(selectedGenre, description.trim())
        : description.trim();

      await uploadContent.mutateAsync({
        id,
        title: title.trim(),
        description: finalDescription,
        mimeType,
        contentBlob,
        thumbnailBlob,
        albumCoverBlob,
      });

      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(msg);
      setUploadProgress(0);
    }
  };

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-arena-neon tracking-wide mb-1">
            Upload Content
          </h1>
          <p className="text-foreground/50 text-sm">
            Share your music or video with the Arena community
          </p>
        </div>

        {/* Category Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            type="button"
            onClick={() => {
              setCategory("audio");
              setMediaFile(null);
              setThumbnailBuffer(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isAudio
                ? "bg-arena-neon text-arena-dark shadow-neon"
                : "bg-arena-surface text-foreground/60 hover:text-foreground hover:bg-arena-surface/80"
            }`}
          >
            <Music className="w-4 h-4" />
            Audio
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory("video");
              setMediaFile(null);
              setThumbnailBuffer(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              !isAudio
                ? "bg-arena-neon text-arena-dark shadow-neon"
                : "bg-arena-surface text-foreground/60 hover:text-foreground hover:bg-arena-surface/80"
            }`}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media File Upload */}
          <FileUploadInput
            category={category}
            label={isAudio ? "Audio File" : "Video File"}
            onFileSelect={setMediaFile}
            selectedFile={mediaFile}
          />

          {/* Thumbnail / Album Art */}
          {mediaFile && (
            <ThumbnailCreator
              mediaFile={mediaFile}
              isAudio={isAudio}
              onThumbnailCapture={handleThumbnailCapture}
            />
          )}

          {/* Album Cover (audio only) */}
          {isAudio && (
            <FileUploadInput
              category="image"
              label="Album Cover (optional)"
              onFileSelect={handleAlbumCoverSelect}
              selectedFile={albumCoverFile}
            />
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="upload-title"
              className="block text-sm font-medium text-foreground/80 mb-2"
            >
              Title *
            </label>
            <Input
              id="upload-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAudio ? "Track title..." : "Video title..."}
              className="bg-arena-surface border-arena-surface/80 focus:border-arena-neon/50"
              maxLength={100}
              data-ocid="upload.title.input"
              style={{ color: "#f0e6c8", WebkitTextFillColor: "#f0e6c8" }}
            />
          </div>

          {/* Genre Selector */}
          <div>
            <p className="block text-sm font-medium text-foreground/80 mb-3">
              Genre *
            </p>
            <div
              className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "oklch(0.78 0.18 85 / 0.3) transparent",
              }}
            >
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() =>
                    setSelectedGenre(selectedGenre === genre ? null : genre)
                  }
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150"
                  style={
                    selectedGenre === genre
                      ? {
                          background: "oklch(0.78 0.18 85)",
                          borderColor: "oklch(0.78 0.18 85)",
                          color: "oklch(0.1 0.03 285)",
                          boxShadow: "0 0 12px oklch(0.78 0.18 85 / 0.5)",
                        }
                      : {
                          background: "oklch(0.12 0.025 285)",
                          borderColor: "oklch(0.25 0.04 285)",
                          color: "oklch(0.65 0.06 285)",
                        }
                  }
                  data-ocid="upload.genre.button"
                >
                  {genre}
                </button>
              ))}
            </div>
            {selectedGenre && (
              <p
                className="mt-2 text-xs"
                style={{ color: "oklch(0.78 0.18 85)" }}
              >
                Selected: <span className="font-bold">{selectedGenre}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="upload-description"
              className="block text-sm font-medium text-foreground/80 mb-2"
            >
              Description
            </label>
            <Textarea
              id="upload-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the community about this content..."
              className="bg-arena-surface border-arena-surface/80 focus:border-arena-neon/50 resize-none"
              rows={4}
              maxLength={500}
              style={{ color: "#f0e6c8", WebkitTextFillColor: "#f0e6c8" }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Upload Progress */}
          {uploadContent.isPending && uploadProgress > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-foreground/50">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-arena-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-arena-neon rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={uploadContent.isPending}
            className="w-full bg-arena-neon text-arena-dark hover:bg-arena-neon/90 font-semibold shadow-neon disabled:opacity-60"
          >
            {uploadContent.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
