import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { User, Trash2, ChevronDown, LogOut, Pencil } from 'lucide-react';
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
import { useGetCallerUserProfile, useDeleteProfile } from '../hooks/useQueries';
import ConfirmationDialog from './ConfirmationDialog';
import EditProfileDialog from './EditProfileDialog';
import { toast } from 'sonner';

export default function ProfileMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const deleteProfile = useDeleteProfile();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!identity) return null;

  const displayName = userProfile?.name ?? identity.getPrincipal().toString().slice(0, 8) + '…';

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
            className="border-arena-neon/30 text-arena-neon hover:bg-arena-neon/10 hover:border-arena-neon/60 gap-1.5"
          >
            <User className="w-4 h-4" />
            <span className="max-w-[100px] truncate hidden sm:inline">{displayName}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-arena-surface border border-arena-border text-foreground min-w-[180px]"
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
            {displayName}
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
