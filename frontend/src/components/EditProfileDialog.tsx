import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useEditProfile, useGetCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const editProfile = useEditProfile();
  const [name, setName] = useState('');

  // Pre-populate with current name whenever dialog opens
  useEffect(() => {
    if (open && userProfile?.name) {
      setName(userProfile.name);
    }
  }, [open, userProfile?.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    editProfile.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully');
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Failed to update profile. Please try again.');
        },
      },
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!editProfile.isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-arena-surface border border-arena-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your artist or creator name. This name is visible to other users.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-sm font-medium text-foreground">
              Display Name
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your artist or creator name"
              disabled={editProfile.isPending}
              maxLength={60}
              className="bg-arena-darker border-arena-border text-foreground placeholder:text-muted-foreground focus:border-arena-neon/60 focus:ring-arena-neon/20"
              autoFocus
            />
            {name.trim().length === 0 && name.length > 0 && (
              <p className="text-xs text-destructive">Name cannot be empty.</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={editProfile.isPending}
              onClick={() => onOpenChange(false)}
              className="border-arena-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editProfile.isPending || name.trim().length === 0}
              className="bg-arena-neon text-arena-darker hover:bg-arena-neon/90 font-semibold disabled:opacity-50"
            >
              {editProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
