import { useState, useEffect } from 'react';
import { useGetAllContent } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { type ContentMetadata, FileType } from '../backend';
import ContentCard from '../components/ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Video, TrendingUp, Clock, Zap } from 'lucide-react';

type FilterTab = 'all' | 'audio' | 'video';

function ContentCardSkeleton() {
  return (
    <div className="bg-card border border-arena-border rounded-lg overflow-hidden">
      <Skeleton className="aspect-video w-full bg-arena-surface" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-arena-surface" />
        <Skeleton className="h-3 w-1/2 bg-arena-surface" />
        <Skeleton className="h-3 w-1/3 bg-arena-surface" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { data: allContent, isLoading, error } = useGetAllContent(0, 50);
  const { actor } = useActor();
  const [uploaderNames, setUploaderNames] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Fetch uploader names
  useEffect(() => {
    if (!allContent || !actor) return;

    const uniquePrincipals = [...new Set(allContent.map((c) => c.uploader.toString()))];
    const missing = uniquePrincipals.filter((p) => !(p in uploaderNames));
    if (missing.length === 0) return;

    missing.forEach(async (principalStr) => {
      try {
        const principal = allContent.find((c) => c.uploader.toString() === principalStr)?.uploader;
        if (!principal) return;
        const profile = await actor.getUserProfile(principal);
        if (profile) {
          setUploaderNames((prev) => ({ ...prev, [principalStr]: profile.name }));
        } else {
          setUploaderNames((prev) => ({
            ...prev,
            [principalStr]: `${principalStr.slice(0, 8)}...`,
          }));
        }
      } catch {
        // silently ignore
      }
    });
  }, [allContent, actor]);

  const filteredContent = (allContent ?? []).filter((c: ContentMetadata) => {
    if (activeTab === 'audio') {
      return c.fileType === FileType.audioMp3 || c.fileType === FileType.audioWav;
    }
    if (activeTab === 'video') {
      return c.fileType === FileType.videoMP4 || c.fileType === FileType.videoWebM || c.fileType === FileType.videoMov;
    }
    return true;
  });

  // Sort by upload time (newest first)
  const sortedContent = [...filteredContent].sort((a, b) => Number(b.uploadTime - a.uploadTime));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero section */}
      <div className="relative rounded-2xl overflow-hidden mb-10 border border-arena-border">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/assets/generated/arena-hero-bg.dim_1440x600.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        <div className="relative px-8 py-12 sm:py-16">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-arena-neon" />
            <span className="text-arena-neon text-sm font-bold uppercase tracking-widest">Live Now</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-display text-foreground mb-3 neon-text">
            THE ARENA
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Discover AI-generated music and video from creators around the world.
          </p>
          <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Music className="w-4 h-4 text-arena-neon" />
              {(allContent ?? []).filter(c => c.fileType === FileType.audioMp3 || c.fileType === FileType.audioWav).length} tracks
            </span>
            <span className="flex items-center gap-1.5">
              <Video className="w-4 h-4 text-blue-400" />
              {(allContent ?? []).filter(c => c.fileType !== FileType.audioMp3 && c.fileType !== FileType.audioWav).length} videos
            </span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="bg-arena-surface border border-arena-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-arena-neon data-[state=active]:text-arena-darker font-semibold">
              All
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-arena-neon data-[state=active]:text-arena-darker font-semibold">
              <Music className="w-3.5 h-3.5 mr-1.5" />
              Music
            </TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-arena-neon data-[state=active]:text-arena-darker font-semibold">
              <Video className="w-3.5 h-3.5 mr-1.5" />
              Video
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Latest first</span>
        </div>
      </div>

      {/* Content grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-destructive font-semibold">Failed to load content. Please refresh.</p>
        </div>
      ) : sortedContent.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 rounded-full bg-arena-surface border border-arena-border flex items-center justify-center mx-auto">
            <TrendingUp className="w-9 h-9 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No content yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {activeTab !== 'all'
              ? `No ${activeTab} content uploaded yet. Be the first!`
              : 'The Arena is empty. Upload your first track or video to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedContent.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              uploaderName={uploaderNames[content.uploader.toString()]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
