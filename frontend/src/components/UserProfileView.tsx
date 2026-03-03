import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { UserRound, Users, UserCheck, Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetProfilePicture,
  useGetUserProfile,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
} from '../hooks/useQueries';
import { toast } from 'sonner';
import FollowersModal from './FollowersModal';

interface UserProfileViewProps {
  targetPrincipal: Principal;
  displayName?: string;
}

export default function UserProfileView({ targetPrincipal, displayName }: UserProfileViewProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);

  const isOwnProfile = identity
    ? identity.getPrincipal().toString() === targetPrincipal.toString()
    : false;

  const { data: pictureBytes, isLoading: pictureLoading } = useGetProfilePicture(targetPrincipal);
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfile(targetPrincipal);
  const { data: isFollowing, isLoading: followStateLoading } = useIsFollowing(
    !isOwnProfile ? targetPrincipal : undefined
  );

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const avatarUrl = useMemo(() => {
    if (!pictureBytes || pictureBytes.length === 0) return null;
    const blob = new Blob([new Uint8Array(pictureBytes)], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  }, [pictureBytes]);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  // Bio: prefer from fetched profile
  const bio = userProfile?.bio ?? null;

  // Counts from the profile (stored on-chain and updated by follow/unfollow)
  const followerCount = userProfile?.counts?.followers ?? 0n;
  const followingCount = userProfile?.counts?.following ?? 0n;

  const resolvedName = displayName ?? userProfile?.name;

  const initials = resolvedName
    ? resolvedName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : targetPrincipal.toString().slice(0, 2).toUpperCase();

  const shortPrincipal =
    targetPrincipal.toString().slice(0, 8) + '…' + targetPrincipal.toString().slice(-4);

  const handleFollow = () => {
    followUser.mutate(targetPrincipal, {
      onSuccess: () => toast.success(`Now following ${resolvedName ?? shortPrincipal}`),
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to follow user';
        toast.error(msg);
      },
    });
  };

  const handleUnfollow = () => {
    unfollowUser.mutate(targetPrincipal, {
      onSuccess: () => toast.success(`Unfollowed ${resolvedName ?? shortPrincipal}`),
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to unfollow user';
        toast.error(msg);
      },
    });
  };

  const handleSendMessage = () => {
    navigate({
      to: '/messages',
      search: { partner: targetPrincipal.toString() },
    });
  };

  const isMutating = followUser.isPending || unfollowUser.isPending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-arena-neon transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </button>

      {/* Profile card */}
      <div className="bg-arena-surface border border-border rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-arena-neon/20 via-arena-neon/5 to-transparent" />

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-12 mb-4">
            {pictureLoading ? (
              <Skeleton className="w-24 h-24 rounded-full" />
            ) : (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-arena-surface bg-arena-neon/10 flex items-center justify-center shadow-neon">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={resolvedName ?? shortPrincipal}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-arena-neon">{initials}</span>
                )}
              </div>
            )}
          </div>

          {/* Name + principal */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">
                {resolvedName ?? shortPrincipal}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">
                {targetPrincipal.toString()}
              </p>

              {/* Follower / following counts */}
              <div className="flex items-center gap-4 mt-3">
                {profileLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <button
                    onClick={() => setIsFollowersModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-arena-neon transition-colors cursor-pointer group"
                  >
                    <Users className="w-4 h-4 text-arena-neon" />
                    <span className="font-semibold text-foreground group-hover:text-arena-neon transition-colors">
                      {followerCount.toString()}
                    </span>
                    <span className="group-hover:text-arena-neon transition-colors">Followers</span>
                  </button>
                )}
                {profileLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UserCheck className="w-4 h-4 text-arena-neon" />
                    <span className="font-semibold text-foreground">
                      {followingCount.toString()}
                    </span>
                    <span>Following</span>
                  </span>
                )}
              </div>

              {/* Bio */}
              {bio && bio.trim().length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-prose">
                  {bio}
                </p>
              )}
            </div>

            {/* Action buttons — hidden on own profile */}
            {!isOwnProfile && identity && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                {/* Follow / Unfollow button */}
                {followStateLoading ? (
                  <Skeleton className="h-9 w-28 rounded-full" />
                ) : isFollowing ? (
                  <Button
                    onClick={handleUnfollow}
                    disabled={isMutating}
                    variant="outline"
                    className="rounded-full border-arena-neon/40 text-arena-neon hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all min-w-[110px]"
                  >
                    {isMutating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-1.5" />
                        Following
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleFollow}
                    disabled={isMutating}
                    className="rounded-full bg-arena-neon text-arena-dark font-bold hover:bg-arena-neon/90 shadow-neon min-w-[110px]"
                  >
                    {isMutating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserRound className="w-4 h-4 mr-1.5" />
                        Follow
                      </>
                    )}
                  </Button>
                )}

                {/* Send Message button */}
                <Button
                  onClick={handleSendMessage}
                  variant="outline"
                  className="rounded-full border-arena-neon/30 text-arena-neon hover:bg-arena-neon/10 hover:border-arena-neon transition-all min-w-[110px]"
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Message
                </Button>
              </div>
            )}

            {/* Not logged in hint */}
            {!isOwnProfile && !identity && (
              <p className="text-xs text-muted-foreground italic self-center">
                Log in to follow
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      <FollowersModal
        user={targetPrincipal}
        open={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
      />
    </div>
  );
}
