import React, { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Music, Video, Layers, TrendingUp, Clock, Search } from 'lucide-react';
import { useGetAllContent, useGetUserProfile } from '../hooks/useQueries';
import { ContentMetadata, FileType } from '../backend';
import ContentCard from '../components/ContentCard';
import { Skeleton } from '@/components/ui/skeleton';

type FilterTab = 'all' | 'music' | 'video';
type SortMode = 'recent' | 'popular';

function isAudioType(ft: FileType): boolean {
  return ft === FileType.audioMp3 || ft === FileType.audioWav;
}

function isVideoType(ft: FileType): boolean {
  return ft === FileType.videoMP4 || ft === FileType.videoWebM || ft === FileType.videoMov;
}

function ContentCardWithUploader({ content }: { content: ContentMetadata }) {
  const { data: profile } = useGetUserProfile(content.uploader);
  const uploaderName = profile?.name ?? content.uploader.toString().slice(0, 8) + '…';
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
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allContent = [], isLoading } = useGetAllContent();

  const filteredContent = useMemo(() => {
    let items = [...allContent];

    // Filter by tab
    if (activeTab === 'music') {
      items = items.filter((c) => isAudioType(c.fileType));
    } else if (activeTab === 'video') {
      items = items.filter((c) => isVideoType(c.fileType));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortMode === 'recent') {
      items.sort((a, b) => Number(b.uploadTime) - Number(a.uploadTime));
    } else {
      items.sort((a, b) => Number(b.views) - Number(a.views));
    }

    return items;
  }, [allContent, activeTab, sortMode, searchQuery]);

  const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Layers className="w-4 h-4" /> },
    { id: 'music', label: 'Music', icon: <Music className="w-4 h-4" /> },
    { id: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '260px' }}>
        <img
          src="/assets/generated/arena-hero-bg.dim_1440x600.png"
          alt="Arena"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-arena-dark/60 via-arena-dark/40 to-arena-dark" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full py-16 px-4 text-center">
          <img
            src="/assets/generated/arena-logo.dim_400x120.png"
            alt="Arena"
            className="h-16 mb-4 drop-shadow-lg"
          />
          <p className="text-muted-foreground text-base max-w-md">
            Discover and share music &amp; videos from creators around the world.
          </p>
          <button
            onClick={() => navigate({ to: '/upload' })}
            className="mt-6 bg-arena-neon text-arena-dark font-bold px-6 py-2.5 rounded-full hover:bg-arena-neon/90 transition-colors text-sm shadow-neon"
          >
            + Upload Content
          </button>
        </div>
      </section>

      {/* Controls */}
      <div className="sticky top-[57px] z-20 bg-arena-dark/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Filter tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                  activeTab === tab.id
                    ? 'border-arena-neon text-arena-neon bg-arena-neon/10 font-semibold'
                    : 'border-border text-muted-foreground hover:border-arena-neon/50 hover:text-foreground'
                }`}
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
                className="w-full bg-arena-surface border border-border rounded-full pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-arena-neon/60"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-1">
              <button
                onClick={() => setSortMode('recent')}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  sortMode === 'recent'
                    ? 'border-arena-neon text-arena-neon bg-arena-neon/10'
                    : 'border-border text-muted-foreground hover:border-arena-neon/50'
                }`}
              >
                <Clock className="w-3 h-3" />
                Recent
              </button>
              <button
                onClick={() => setSortMode('popular')}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  sortMode === 'popular'
                    ? 'border-arena-neon text-arena-neon bg-arena-neon/10'
                    : 'border-border text-muted-foreground hover:border-arena-neon/50'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Popular
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-arena-surface flex items-center justify-center">
              {activeTab === 'music' ? (
                <Music className="w-8 h-8 text-muted-foreground" />
              ) : activeTab === 'video' ? (
                <Video className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Layers className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-foreground font-semibold">No content found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery
                  ? 'Try a different search term.'
                  : activeTab === 'music'
                  ? 'No music uploaded yet. Be the first!'
                  : activeTab === 'video'
                  ? 'No videos uploaded yet. Be the first!'
                  : 'No content uploaded yet. Be the first!'}
              </p>
            </div>
            <button
              onClick={() => navigate({ to: '/upload' })}
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
