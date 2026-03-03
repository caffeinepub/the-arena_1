import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, ChevronDown, LogOut, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useDeleteProfile, useGetProfilePicture } from '../hooks/useQueries';
import ConfirmationDialog from './ConfirmationDialog';
import EditProfileDialog from './EditProfileDialog';
import { toast } from 'sonner';

export default function ProfileMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const deleteProfile = useDeleteProfile();
  const principal = identity?.getPrincipal();
  const { data: pictureBytes } = useGetProfilePicture(principal);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Convert picture bytes to a blob URL
  // Wrap in new Uint8Array(...) to ensure ArrayBuffer (not ArrayBufferLike) for Blob constructor
  const avatarUrl = useMemo(() => {
    if (!pictureBytes || pictureBytes.length === 0) return null;
    const blob = new Blob([new Uint8Array(pictureBytes)], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  }, [pictureBytes]);

  // Revoke old blob URL when it changes
  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  if (!identity) return null;

  const displayName = userProfile?.name ?? identity.getPrincipal().toString().slice(0, 8) + '…';

  // Derive initials from display name for fallback
  const initials = userProfile?.name
    ? userProfile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const handleLogout = async () => {
    queryClient.clear();
    await clear();
    navigate({ to: '/' });
  };

  const handleDeleteProfile = async () => {
    deleteProfile.mutate(undefined, {
      onSuccess: async () => {
        setDeleteDialogOpen(false);
        toast.success('Account deleted successfully');
        queryClient.clear();
        await clear();
        navigate({ to: '/' });
      },
      onError: () => {
        toast.error('Failed to delete account. Please try again.');
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-arena-neon/30 text-arena-neon hover:bg-arena-neon/10 hover:border-arena-neon/60 gap-1.5 pl-1.5"
          >
            {/* Avatar */}
            <span className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-arena-neon/10 border border-arena-neon/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-arena-neon leading-none">{initials}</span>
              )}
            </span>
            <span className="max-w-[100px] truncate hidden sm:inline">{displayName}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-arena-surface border border-arena-border text-foreground min-w-[180px]"
        >
          {/* Avatar + name in label */}
          <DropdownMenuLabel className="flex items-center gap-2 py-2">
            <span className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-arena-neon/10 border border-arena-neon/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-arena-neon leading-none">{initials}</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground font-normal truncate">{displayName}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-arena-border" />

          {/* Edit Profile */}
          <DropdownMenuItem
            onClick={() => setEditDialogOpen(true)}
            className="cursor-pointer gap-2 focus:bg-arena-neon/10 focus:text-arena-neon"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-arena-border" />

          {/* Logout */}
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer gap-2 focus:bg-muted/50"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-arena-border" />

          {/* Delete Account */}
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Account"
        description="This will permanently delete your account and all your uploaded content. This action cannot be undone."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        onConfirm={handleDeleteProfile}
        isPending={deleteProfile.isPending}
        destructive
      />
    </>
  );
}
