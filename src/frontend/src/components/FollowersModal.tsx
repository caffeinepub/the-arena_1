import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@dfinity/principal";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, UserRound, Users } from "lucide-react";
import { useMemo } from "react";
import {
  useGetFollowersList,
  useGetProfilePicture,
  useGetUserProfile,
} from "../hooks/useQueries";

interface FollowerItemProps {
  followerPrincipal: Principal;
  onNavigate: (principal: Principal) => void;
}

function FollowerItem({ followerPrincipal, onNavigate }: FollowerItemProps) {
  const { data: profile, isLoading: profileLoading } =
    useGetUserProfile(followerPrincipal);
  const { data: pictureBytes, isLoading: pictureLoading } =
    useGetProfilePicture(followerPrincipal);

  const avatarUrl = useMemo(() => {
    if (!pictureBytes || pictureBytes.length === 0) return null;
    const blob = new Blob([new Uint8Array(pictureBytes)], {
      type: "image/jpeg",
    });
    return URL.createObjectURL(blob);
  }, [pictureBytes]);

  const shortPrincipal = `${followerPrincipal.toString().slice(0, 8)}…${followerPrincipal.toString().slice(-4)}`;

  const displayName = profile?.name ?? shortPrincipal;

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : followerPrincipal.toString().slice(0, 2).toUpperCase();

  const isLoading = profileLoading || pictureLoading;

  return (
    <button
      type="button"
      onClick={() => onNavigate(followerPrincipal)}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-arena-neon/5 transition-colors text-left group"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-arena-neon/20 bg-arena-neon/10 flex items-center justify-center flex-shrink-0 group-hover:border-arena-neon/50 transition-colors">
        {isLoading ? (
          <Skeleton className="w-10 h-10 rounded-full" />
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-arena-neon">{initials}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-arena-neon transition-colors">
            {displayName}
          </p>
        )}
        {!isLoading && (
          <p className="text-xs text-muted-foreground font-mono truncate">
            {shortPrincipal}
          </p>
        )}
      </div>

      {/* Arrow indicator */}
      <UserRound className="w-4 h-4 text-muted-foreground group-hover:text-arena-neon transition-colors flex-shrink-0" />
    </button>
  );
}

interface FollowersModalProps {
  user: Principal;
  open: boolean;
  onClose: () => void;
}

export default function FollowersModal({
  user,
  open,
  onClose,
}: FollowersModalProps) {
  const navigate = useNavigate();
  const { data: followers, isLoading } = useGetFollowersList(
    open ? user : undefined,
  );

  const handleNavigate = (principal: Principal) => {
    onClose();
    navigate({
      to: "/profile/$principal",
      params: { principal: principal.toString() },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="bg-arena-surface border-border max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-arena-neon" />
            Followers
            {!isLoading && followers && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({followers.length})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-arena-neon" />
            </div>
          ) : !followers || followers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <Users className="w-10 h-10 opacity-30" />
              <p className="text-sm">No followers yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 pr-2">
              {followers.map((follower) => (
                <FollowerItem
                  key={follower.toString()}
                  followerPrincipal={follower}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
