import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Layers, Music, Search, TrendingUp, Video } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import type { ContentMetadata } from "../backend";
import ContentCard from "../components/ContentCard";
import { useGetAllContent, useGetUserProfile } from "../hooks/useQueries";
import { GENRES, type Genre, parseGenre } from "../utils/genres";

type FilterTab = "all" | "music" | "video";
type SortMode = "recent" | "popular";

function isAudioMime(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

function ContentCardWithUploader({ content }: { content: ContentMetadata }) {
  const { data: profile } = useGetUserProfile(content.uploader);
  const uploaderName =
    profile?.name ?? `${content.uploader.toString().slice(0, 8)}…`;
  return <ContentCard content={content} uploaderName={uploaderName} />;
}

function SkeletonCard() {
  return (
    <div className="bg-arena-surface border border-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<Genre | null>(null);
  const genreScrollRef = useRef<HTMLDivElement>(null);

  const { data: allContent = [], isLoading } = useGetAllContent();

  const filteredContent = useMemo(() => {
    let items = [...allContent];

    // Filter by tab
    if (activeTab === "music") {
      items = items.filter((c) => isAudioMime(c.mimeType));
    } else if (activeTab === "video") {
      items = items.filter((c) => isVideoMime(c.mimeType));
    }

    // Filter by genre
    if (activeGenre) {
      items = items.filter((c) => parseGenre(c.description) === activeGenre);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }

    // Sort
    if (sortMode === "recent") {
      items.sort((a, b) => Number(b.uploadTime) - Number(a.uploadTime));
    } else {
      items.sort((a, b) => Number(b.views) - Number(a.views));
    }

    return items;
  }, [allContent, activeTab, activeGenre, sortMode, searchQuery]);

  const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <Layers className="w-4 h-4" /> },
    { id: "music", label: "Music", icon: <Music className="w-4 h-4" /> },
    { id: "video", label: "Video", icon: <Video className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section
        className="relative w-full overflow-hidden flex items-center justify-center"
        style={{
          minHeight: "360px",
          background:
            "radial-gradient(ellipse 100% 80% at 50% 0%, oklch(0.28 0.18 295) 0%, oklch(0.15 0.1 285) 45%, oklch(0.07 0.02 285) 100%)",
        }}
      >
        {/* Subtle textile-like background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, oklch(0.78 0.18 85) 0px, oklch(0.78 0.18 85) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(-45deg, oklch(0.78 0.18 85) 0px, oklch(0.78 0.18 85) 1px, transparent 1px, transparent 12px)",
          }}
        />

        {/* Decorative glowing rings — gold */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: "560px",
            height: "560px",
            border: "1px solid oklch(0.78 0.18 85 / 0.18)",
            boxShadow: "0 0 80px 0 oklch(0.78 0.18 85 / 0.08)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: "360px",
            height: "360px",
            border: "1px solid oklch(0.78 0.18 85 / 0.1)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: "180px",
            height: "180px",
            border: "1px solid oklch(0.78 0.18 85 / 0.08)",
          }}
        />

        {/* Crown ornament top */}
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 text-2xl pointer-events-none select-none"
          style={{
            color: "oklch(0.78 0.18 85)",
            filter: "drop-shadow(0 0 8px oklch(0.78 0.18 85 / 0.6))",
            opacity: 0.7,
          }}
        >
          ♛
        </div>

        {/* Decorative horizontal rule */}
        <div
          className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: "180px",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.18 85 / 0.5), transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-4 text-center">
          {/* Wordmark */}
          <div className="mb-4">
            <div
              className="text-xs font-semibold tracking-[0.4em] uppercase mb-2"
              style={{ color: "oklch(0.65 0.12 85)" }}
            >
              Welcome to
            </div>
            <span
              className="font-display tracking-[0.15em] uppercase text-4xl sm:text-6xl font-bold block"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.96 0.12 90) 0%, oklch(0.82 0.2 85) 40%, oklch(0.65 0.14 75) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 16px oklch(0.78 0.18 85 / 0.4))",
                textShadow: "none",
              }}
            >
              THE ARENA
            </span>
            {/* Gold underline rule */}
            <div
              className="mx-auto mt-3"
              style={{
                width: "120px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, oklch(0.78 0.18 85), transparent)",
              }}
            />
          </div>
          <p
            className="text-base max-w-md mt-2"
            style={{ color: "oklch(0.65 0.06 285)" }}
          >
            Where creators rise and legends are made.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/upload" })}
            className="mt-6 font-bold px-7 py-2.5 rounded-full transition-all text-sm hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.65 0.16 75))",
              color: "oklch(0.1 0.03 285)",
              boxShadow:
                "0 0 20px oklch(0.78 0.18 85 / 0.4), 0 2px 8px oklch(0.1 0.02 285 / 0.5)",
            }}
            data-ocid="feed.upload.primary_button"
          >
            + Upload Content
          </button>
        </div>
      </section>

      {/* Controls */}
      <div
        className="sticky top-[57px] z-20 backdrop-blur px-4 py-3"
        style={{
          background: "oklch(0.07 0.02 285 / 0.95)",
          borderBottom: "1px solid oklch(0.78 0.18 85 / 0.15)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Filter tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border transition-colors font-semibold"
                style={
                  activeTab === tab.id
                    ? {
                        borderColor: "oklch(0.78 0.18 85 / 0.7)",
                        color: "oklch(0.88 0.18 85)",
                        background: "oklch(0.78 0.18 85 / 0.1)",
                      }
                    : {
                        borderColor: "oklch(0.25 0.04 285)",
                        color: "oklch(0.55 0.04 285)",
                      }
                }
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-full pl-8 pr-3 py-1.5 text-sm focus:outline-none"
                style={{
                  background: "oklch(0.12 0.025 285)",
                  border: "1px solid oklch(0.22 0.04 285)",
                  color: "#f0e6c8",
                  WebkitTextFillColor: "#f0e6c8",
                }}
                data-ocid="feed.search.input"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSortMode("recent")}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={
                  sortMode === "recent"
                    ? {
                        borderColor: "oklch(0.78 0.18 85 / 0.7)",
                        color: "oklch(0.88 0.18 85)",
                        background: "oklch(0.78 0.18 85 / 0.1)",
                      }
                    : {
                        borderColor: "oklch(0.25 0.04 285)",
                        color: "oklch(0.55 0.04 285)",
                      }
                }
              >
                <Clock className="w-3 h-3" />
                Recent
              </button>
              <button
                type="button"
                onClick={() => setSortMode("popular")}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={
                  sortMode === "popular"
                    ? {
                        borderColor: "oklch(0.78 0.18 85 / 0.7)",
                        color: "oklch(0.88 0.18 85)",
                        background: "oklch(0.78 0.18 85 / 0.1)",
                      }
                    : {
                        borderColor: "oklch(0.25 0.04 285)",
                        color: "oklch(0.55 0.04 285)",
                      }
                }
              >
                <TrendingUp className="w-3 h-3" />
                Popular
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Genre Filter Row */}
      <div
        className="px-4 py-2"
        style={{
          background: "oklch(0.07 0.02 285 / 0.98)",
          borderBottom: "1px solid oklch(0.78 0.18 85 / 0.08)",
        }}
      >
        <div
          ref={genreScrollRef}
          className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* "All Genres" reset button */}
          <button
            type="button"
            onClick={() => setActiveGenre(null)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={
              activeGenre === null
                ? {
                    borderColor: "oklch(0.78 0.18 85 / 0.7)",
                    color: "oklch(0.88 0.18 85)",
                    background: "oklch(0.78 0.18 85 / 0.1)",
                  }
                : {
                    borderColor: "oklch(0.22 0.04 285)",
                    color: "oklch(0.5 0.04 285)",
                  }
            }
            data-ocid="feed.genre.all.tab"
          >
            All Genres
          </button>
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() =>
                setActiveGenre(activeGenre === genre ? null : genre)
              }
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={
                activeGenre === genre
                  ? {
                      borderColor: "oklch(0.78 0.18 85 / 0.7)",
                      color: "oklch(0.88 0.18 85)",
                      background: "oklch(0.78 0.18 85 / 0.1)",
                    }
                  : {
                      borderColor: "oklch(0.22 0.04 285)",
                      color: "oklch(0.5 0.04 285)",
                    }
              }
              data-ocid="feed.genre.tab"
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list with fixed length, order never changes
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-arena-surface flex items-center justify-center">
              {activeTab === "music" ? (
                <Music className="w-8 h-8 text-muted-foreground" />
              ) : activeTab === "video" ? (
                <Video className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Layers className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-foreground font-semibold">No content found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery
                  ? "Try a different search term."
                  : activeTab === "music"
                    ? "No music uploaded yet. Be the first!"
                    : activeTab === "video"
                      ? "No videos uploaded yet. Be the first!"
                      : "No content uploaded yet. Be the first!"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/upload" })}
              className="text-sm text-arena-neon border border-arena-neon/40 rounded-full px-4 py-2 hover:bg-arena-neon/10 transition-colors"
            >
              Upload Content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredContent.map((content) => (
              <ContentCardWithUploader key={content.id} content={content} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
