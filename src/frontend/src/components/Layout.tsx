import { Link, useLocation, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  Crown,
  ListMusic,
  MessageSquare,
  Tv2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetPlaybackQueue } from "../hooks/useQueries";
import LoginButton from "./LoginButton";
import ProfileMenu from "./ProfileMenu";
import QueuePanel from "./QueuePanel";

interface NavLink {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [queueOpen, setQueueOpen] = useState(false);
  const { data: queue = [] } = useGetPlaybackQueue();
  const { identity } = useInternetIdentity();

  // Extract currently playing content ID from the route if on a content detail page
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const contentDetailMatch = currentPath.match(/^\/content\/(.+)$/);
  const currentlyPlayingContentId = contentDetailMatch
    ? contentDetailMatch[1]
    : undefined;

  const navLinks: NavLink[] = [
    { to: "/", label: "Feed", icon: <Tv2 className="w-4 h-4" /> },
    { to: "/charts", label: "Charts", icon: <BarChart2 className="w-4 h-4" /> },
    { to: "/upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
    { to: "/mind", label: "Mind", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: "oklch(0.07 0.02 285 / 0.92)",
          borderBottom: "1px solid oklch(0.78 0.18 85 / 0.25)",
          boxShadow: "0 2px 24px oklch(0.35 0.18 295 / 0.3)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
              data-ocid="nav.home.link"
            >
              <Crown
                className="w-6 h-6 flex-shrink-0"
                style={{
                  color: "oklch(0.78 0.18 85)",
                  filter: "drop-shadow(0 0 6px oklch(0.78 0.18 85 / 0.7))",
                }}
              />
              <span
                className="font-display text-2xl font-bold tracking-widest uppercase"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.95 0.12 90), oklch(0.78 0.18 85), oklch(0.62 0.14 75))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 12px oklch(0.78 0.18 85 / 0.5))",
                  letterSpacing: "0.12em",
                }}
              >
                THE ARENA
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                const badge = link.badge ?? 0;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    data-ocid={`nav.${link.label.toLowerCase()}.link`}
                    className="relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: "oklch(0.78 0.18 85 / 0.12)",
                            color: "oklch(0.88 0.18 85)",
                            border: "1px solid oklch(0.78 0.18 85 / 0.4)",
                            boxShadow: "0 0 8px oklch(0.78 0.18 85 / 0.2)",
                          }
                        : {
                            color: "oklch(0.65 0.04 285)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    {link.icon}
                    {link.label}
                    {badge > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold rounded-full px-0.5 leading-none"
                        style={{
                          background: "oklch(0.78 0.18 85)",
                          color: "oklch(0.1 0.03 285)",
                        }}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Auth + Queue */}
            <div className="flex items-center gap-2">
              {/* Queue button */}
              <button
                type="button"
                onClick={() => setQueueOpen(true)}
                className="relative p-2 rounded-md transition-all duration-200 group"
                style={{ color: "oklch(0.6 0.04 285)" }}
                aria-label="Open playback queue"
                title="Playback Queue"
                data-ocid="nav.queue.button"
              >
                <ListMusic className="w-5 h-5" />
                {queue.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 leading-none"
                    style={{
                      background: "oklch(0.78 0.18 85)",
                      color: "oklch(0.1 0.03 285)",
                    }}
                  >
                    {queue.length > 99 ? "99+" : queue.length}
                  </span>
                )}
              </button>
              {identity ? <ProfileMenu /> : <LoginButton />}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className="sm:hidden"
          style={{ borderTop: "1px solid oklch(0.78 0.18 85 / 0.15)" }}
        >
          <div className="flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              const badge = link.badge ?? 0;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  data-ocid={`nav.mobile.${link.label.toLowerCase()}.link`}
                  className="relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all"
                  style={
                    isActive
                      ? {
                          color: "oklch(0.88 0.18 85)",
                          borderBottom: "2px solid oklch(0.78 0.18 85)",
                        }
                      : { color: "oklch(0.55 0.04 285)" }
                  }
                >
                  {link.icon}
                  {link.label}
                  {badge > 0 && (
                    <span
                      className="absolute top-1.5 right-1/4 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] font-bold rounded-full px-0.5"
                      style={{
                        background: "oklch(0.78 0.18 85)",
                        color: "oklch(0.1 0.03 285)",
                      }}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Mobile queue button */}
            <button
              type="button"
              onClick={() => setQueueOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold relative"
              style={{ color: "oklch(0.55 0.04 285)" }}
              aria-label="Open queue"
              data-ocid="nav.mobile.queue.button"
            >
              <ListMusic className="w-4 h-4" />
              Queue
              {queue.length > 0 && (
                <span
                  className="absolute top-1.5 right-1/4 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold rounded-full px-0.5"
                  style={{
                    background: "oklch(0.78 0.18 85)",
                    color: "oklch(0.1 0.03 285)",
                  }}
                >
                  {queue.length > 9 ? "9+" : queue.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer
        className="py-6 mt-auto"
        style={{
          borderTop: "1px solid oklch(0.78 0.18 85 / 0.2)",
          background: "oklch(0.08 0.02 285 / 0.8)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Crown
              className="w-4 h-4"
              style={{ color: "oklch(0.78 0.18 85)" }}
            />
            <span
              className="font-display font-bold text-lg tracking-widest uppercase"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.92 0.15 90), oklch(0.78 0.18 85))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              THE ARENA
            </span>
            <span style={{ color: "oklch(0.45 0.03 285)" }}>
              © {new Date().getFullYear()}
            </span>
          </div>
          <div
            className="flex items-center gap-1"
            style={{ color: "oklch(0.45 0.03 285)" }}
          >
            Built with{" "}
            <span style={{ color: "oklch(0.78 0.18 85)" }} className="mx-0.5">
              ♛
            </span>{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "the-arena")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
              style={{ color: "oklch(0.78 0.18 85)" }}
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>

      {/* Queue Panel */}
      <QueuePanel
        isOpen={queueOpen}
        onClose={() => setQueueOpen(false)}
        currentlyPlayingContentId={currentlyPlayingContentId}
      />
    </div>
  );
}
