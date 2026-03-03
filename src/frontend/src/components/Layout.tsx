import { Link, useLocation, useRouterState } from "@tanstack/react-router";
import { Heart, ListMusic, MessageSquare, Tv2, Upload } from "lucide-react";
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
    { to: "/upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
    { to: "/mind", label: "Mind", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-arena-border bg-arena-surface/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/assets/generated/arena-logo.dim_400x120.png"
                alt="The Arena"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const sibling = target.nextElementSibling as HTMLElement;
                  if (sibling) sibling.style.display = "block";
                }}
              />
              <span
                className="font-display text-3xl text-arena-neon neon-text hidden"
                style={{ display: "none" }}
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
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-arena-neon/10 text-arena-neon border border-arena-neon/30 neon-glow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-arena-neon text-arena-darker text-[9px] font-bold rounded-full px-0.5 leading-none">
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
                className="relative p-2 rounded-md text-muted-foreground hover:text-arena-neon hover:bg-arena-neon/10 transition-all duration-200 group"
                aria-label="Open playback queue"
                title="Playback Queue"
              >
                <ListMusic className="w-5 h-5 group-hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.8)] transition-all" />
                {queue.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-arena-neon text-arena-darker text-[10px] font-bold rounded-full px-1 leading-none">
                    {queue.length > 99 ? "99+" : queue.length}
                  </span>
                )}
              </button>
              {identity ? <ProfileMenu /> : <LoginButton />}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t border-arena-border">
          <div className="flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              const badge = link.badge ?? 0;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "text-arena-neon border-b-2 border-arena-neon"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {badge > 0 && (
                    <span className="absolute top-1.5 right-1/4 min-w-[14px] h-[14px] flex items-center justify-center bg-arena-neon text-arena-darker text-[8px] font-bold rounded-full px-0.5">
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
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-muted-foreground relative"
              aria-label="Open queue"
            >
              <ListMusic className="w-4 h-4" />
              Queue
              {queue.length > 0 && (
                <span className="absolute top-1.5 right-1/4 min-w-[16px] h-[16px] flex items-center justify-center bg-arena-neon text-arena-darker text-[9px] font-bold rounded-full px-0.5">
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
      <footer className="border-t border-arena-border bg-arena-surface/50 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-display text-arena-neon text-lg">
              THE ARENA
            </span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-1">
            Built with{" "}
            <Heart className="w-3.5 h-3.5 text-arena-neon fill-arena-neon mx-0.5" />{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "the-arena")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-arena-neon hover:underline font-semibold"
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
