import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@dfinity/principal";
import { useNavigate } from "@tanstack/react-router";
import { BarChart2, Crown, Heart, Music, Play, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { ContentMetadata } from "../backend";
import { useGetAllContent, useGetUserProfile } from "../hooks/useQueries";

// ─── Time scope ───────────────────────────────────────────────────────────────

type TimeScope = "daily" | "weekly" | "alltime";

const SCOPE_LABELS: Record<TimeScope, string> = {
  daily: "Daily",
  weekly: "Weekly",
  alltime: "All-Time",
};

// ─── Rank medal colours ────────────────────────────────────────────────────────

const RANK_STYLES: Record<
  number,
  { badge: string; glow: string; label: string; bg: string; border: string }
> = {
  1: {
    badge: "linear-gradient(135deg, oklch(0.95 0.18 90), oklch(0.75 0.2 80))",
    glow: "0 0 20px oklch(0.78 0.18 85 / 0.5)",
    label: "oklch(0.1 0.03 285)",
    bg: "oklch(0.78 0.18 85 / 0.08)",
    border: "oklch(0.78 0.18 85 / 0.45)",
  },
  2: {
    badge: "linear-gradient(135deg, oklch(0.9 0.04 220), oklch(0.72 0.06 210))",
    glow: "0 0 16px oklch(0.75 0.05 220 / 0.4)",
    label: "oklch(0.1 0.02 220)",
    bg: "oklch(0.75 0.05 220 / 0.06)",
    border: "oklch(0.75 0.05 220 / 0.35)",
  },
  3: {
    badge: "linear-gradient(135deg, oklch(0.75 0.12 55), oklch(0.58 0.14 45))",
    glow: "0 0 14px oklch(0.66 0.12 50 / 0.4)",
    label: "oklch(0.1 0.02 285)",
    bg: "oklch(0.66 0.12 50 / 0.06)",
    border: "oklch(0.66 0.12 50 / 0.35)",
  },
};

const DEFAULT_RANK_STYLE = {
  badge: "oklch(0.18 0.04 285)",
  glow: "none",
  label: "oklch(0.6 0.04 285)",
  bg: "oklch(0.1 0.02 285 / 0.4)",
  border: "oklch(0.22 0.04 285 / 0.5)",
};

// ─── Sub-component: single chart row ─────────────────────────────────────────

function ChartRowArtist({ principal }: { principal: Principal }) {
  const { data: profile } = useGetUserProfile(principal);
  const name = profile?.name ?? `${principal.toString().slice(0, 8)}…`;
  return <span>{name}</span>;
}

function ChartRow({
  content,
  rank,
}: { content: ContentMetadata; rank: number }) {
  const navigate = useNavigate();
  const rs = RANK_STYLES[rank] ?? DEFAULT_RANK_STYLE;
  const score = Number(content.views) + Number(content.likes);

  const coverUrl = content.albumCoverBlob
    ? content.albumCoverBlob.getDirectURL()
    : null;

  const handlePlay = () => {
    navigate({ to: "/content/$id", params: { id: content.id } });
  };

  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left"
      style={{
        background: rs.bg,
        border: `1px solid ${rs.border}`,
        boxShadow: rank <= 3 ? rs.glow : undefined,
      }}
      onClick={handlePlay}
      data-ocid={`charts.row.item.${rank}`}
    >
      {/* Rank badge */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm select-none"
        style={{
          background: rs.badge,
          color: rs.label,
          boxShadow: rank <= 3 ? rs.glow : undefined,
          minWidth: "2rem",
        }}
      >
        {rank}
      </div>

      {/* Album cover */}
      <div
        className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden"
        style={{ border: "1px solid oklch(0.22 0.04 285)" }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.15 0.06 285), oklch(0.22 0.1 295))",
            }}
          >
            <Music
              className="w-5 h-5"
              style={{ color: "oklch(0.55 0.08 285)" }}
            />
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p
          className="font-display font-semibold text-sm sm:text-base truncate leading-tight"
          style={{ color: "oklch(0.92 0.04 285)" }}
        >
          {content.title}
        </p>
        <p
          className="text-xs sm:text-sm mt-0.5 truncate"
          style={{ color: "oklch(0.58 0.06 285)" }}
        >
          <ChartRowArtist principal={content.uploader} />
        </p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "oklch(0.55 0.05 285)" }}
        >
          <Play className="w-3 h-3" />
          <span>{Number(content.views).toLocaleString()}</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "oklch(0.55 0.05 285)" }}
        >
          <Heart className="w-3 h-3" />
          <span>{Number(content.likes).toLocaleString()}</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "oklch(0.78 0.18 85 / 0.9)" }}
        >
          <span>{score.toLocaleString()}</span>
        </div>
      </div>

      {/* Play button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePlay();
        }}
        className="flex-shrink-0 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 group-focus:opacity-100"
        style={{
          background: "oklch(0.78 0.18 85 / 0.12)",
          color: "oklch(0.82 0.18 85)",
          border: "1px solid oklch(0.78 0.18 85 / 0.4)",
        }}
        aria-label={`Play ${content.title}`}
        data-ocid={`charts.play.button.${rank}`}
      >
        <PlayCircle className="w-5 h-5" />
      </button>
    </button>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl"
      style={{
        background: "oklch(0.1 0.02 285 / 0.4)",
        border: "1px solid oklch(0.18 0.03 285)",
      }}
      data-ocid="charts.loading_state"
    >
      <Skeleton
        className="w-8 h-8 rounded-full flex-shrink-0"
        style={{ animationDelay: `${index * 60}ms` }}
      />
      <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="hidden sm:flex gap-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// ─── Scope toggle ─────────────────────────────────────────────────────────────

function ScopeToggle({
  scope,
  onChange,
}: { scope: TimeScope; onChange: (s: TimeScope) => void }) {
  const scopes: TimeScope[] = ["daily", "weekly", "alltime"];
  return (
    <fieldset
      className="inline-flex rounded-xl p-1 gap-1 border-0 m-0 p-1"
      style={{
        background: "oklch(0.12 0.04 285 / 0.8)",
        border: "1px solid oklch(0.28 0.06 285 / 0.5)",
        borderRadius: "0.75rem",
        padding: "0.25rem",
        gap: "0.25rem",
        display: "inline-flex",
      }}
      aria-label="Chart time scope"
    >
      {scopes.map((s) => {
        const active = scope === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={
              active
                ? {
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.18 85 / 0.25), oklch(0.65 0.16 75 / 0.2))",
                    color: "oklch(0.9 0.16 85)",
                    border: "1px solid oklch(0.78 0.18 85 / 0.45)",
                    boxShadow: "0 0 10px oklch(0.78 0.18 85 / 0.2)",
                  }
                : {
                    background: "transparent",
                    color: "oklch(0.55 0.06 285)",
                    border: "1px solid transparent",
                  }
            }
            data-ocid={`charts.scope.${s}.toggle`}
          >
            {SCOPE_LABELS[s]}
          </button>
        );
      })}
    </fieldset>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const NANOS_PER_MS = 1_000_000n;

export default function ChartsPage() {
  const { data: allContent = [], isLoading } = useGetAllContent(0, 200);
  const [scope, setScope] = useState<TimeScope>("daily");

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const topTracks = useMemo(() => {
    const now = new Date();
    const audioOnly = allContent.filter((c) => c.mimeType.startsWith("audio/"));

    let filtered: ContentMetadata[];

    if (scope === "daily") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const startMs = BigInt(startOfDay.getTime()) * NANOS_PER_MS;
      filtered = audioOnly.filter((c) => c.uploadTime >= startMs);
      // Fall back to all audio if no tracks today
      if (filtered.length === 0) filtered = audioOnly;
    } else if (scope === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const startMs = BigInt(startOfWeek.getTime()) * NANOS_PER_MS;
      filtered = audioOnly.filter((c) => c.uploadTime >= startMs);
      // Fall back to all audio if no tracks this week
      if (filtered.length === 0) filtered = audioOnly;
    } else {
      filtered = audioOnly;
    }

    return [...filtered]
      .sort(
        (a, b) =>
          Number(b.views) +
          Number(b.likes) -
          (Number(a.views) + Number(a.likes)),
      )
      .slice(0, 10);
  }, [allContent, scope]);

  const scopeSubLabel =
    scope === "daily"
      ? `Daily Charts — ${dateLabel}`
      : scope === "weekly"
        ? "Top tracks from the last 7 days"
        : "All-Time greatest hits";

  return (
    <div className="min-h-screen" data-ocid="charts.page">
      {/* Hero header */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 0%, oklch(0.26 0.2 285) 0%, oklch(0.13 0.1 285) 50%, oklch(0.07 0.02 285) 100%)",
          borderBottom: "1px solid oklch(0.78 0.18 85 / 0.2)",
        }}
      >
        {/* Diagonal hatching texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(60deg, oklch(0.78 0.18 85) 0px, oklch(0.78 0.18 85) 1px, transparent 1px, transparent 16px)",
          }}
        />

        {/* Glow rings */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: "500px",
            height: "500px",
            border: "1px solid oklch(0.78 0.18 85 / 0.12)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: "300px",
            height: "300px",
            border: "1px solid oklch(0.78 0.18 85 / 0.08)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          {/* Crown + icon row */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown
              className="w-6 h-6 flex-shrink-0"
              style={{
                color: "oklch(0.78 0.18 85)",
                filter: "drop-shadow(0 0 8px oklch(0.78 0.18 85 / 0.6))",
              }}
            />
            <BarChart2
              className="w-6 h-6 flex-shrink-0"
              style={{
                color: "oklch(0.78 0.18 85)",
                filter: "drop-shadow(0 0 6px oklch(0.78 0.18 85 / 0.5))",
              }}
            />
            <Crown
              className="w-6 h-6 flex-shrink-0"
              style={{
                color: "oklch(0.78 0.18 85)",
                filter: "drop-shadow(0 0 8px oklch(0.78 0.18 85 / 0.6))",
              }}
            />
          </div>

          {/* Title */}
          <h1
            className="font-display font-bold uppercase tracking-[0.12em] text-3xl sm:text-5xl mb-2"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.96 0.12 90) 0%, oklch(0.82 0.2 85) 45%, oklch(0.65 0.14 75) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 16px oklch(0.78 0.18 85 / 0.35))",
            }}
          >
            Top 10 AI Music Charts
          </h1>

          {/* Ornamental rule */}
          <div
            className="mx-auto my-3"
            style={{
              width: "100px",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, oklch(0.78 0.18 85), transparent)",
            }}
          />

          {/* Scope toggle */}
          <div className="flex justify-center mb-4">
            <ScopeToggle scope={scope} onChange={setScope} />
          </div>

          {/* Date sub-label */}
          <p
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: "oklch(0.6 0.1 85)" }}
          >
            {scopeSubLabel}
          </p>
          <p className="mt-2 text-sm" style={{ color: "oklch(0.5 0.04 285)" }}>
            Ranked by total plays &amp; likes
          </p>
        </div>
      </section>

      {/* Chart list */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton list
              <SkeletonRow key={`sk-${i}`} index={i} />
            ))}
          </div>
        ) : topTracks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-5 text-center rounded-2xl"
            style={{
              background: "oklch(0.1 0.02 285 / 0.5)",
              border: "1px solid oklch(0.22 0.04 285 / 0.5)",
            }}
            data-ocid="charts.empty_state"
          >
            {/* Music icon ring */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.15 0.06 285), oklch(0.22 0.1 295))",
                border: "1px solid oklch(0.78 0.18 85 / 0.25)",
                boxShadow: "0 0 20px oklch(0.78 0.18 85 / 0.1)",
              }}
            >
              <Music
                className="w-9 h-9"
                style={{ color: "oklch(0.65 0.12 85)" }}
              />
            </div>

            <div>
              <p
                className="font-display font-semibold text-lg"
                style={{ color: "oklch(0.82 0.06 285)" }}
              >
                No tracks in the charts yet
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "oklch(0.5 0.04 285)" }}
              >
                Upload some music to get started!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Column labels */}
            <div
              className="hidden sm:flex items-center gap-4 px-4 pb-1 text-xs font-semibold tracking-widest uppercase"
              style={{ color: "oklch(0.4 0.04 285)" }}
            >
              <span className="w-8 flex-shrink-0 text-center">#</span>
              <span className="w-14 flex-shrink-0" />
              <span className="flex-1">Track</span>
              <div className="flex items-center gap-4 pr-10">
                <span className="w-16 text-center">Plays</span>
                <span className="w-12 text-center">Likes</span>
                <span className="w-12 text-center">Score</span>
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.78 0.18 85 / 0.3), transparent)",
              }}
            />

            {/* Rows */}
            {topTracks.map((track, idx) => (
              <ChartRow key={track.id} content={track} rank={idx + 1} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
