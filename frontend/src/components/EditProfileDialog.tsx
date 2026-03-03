import { useState, useEffect, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Camera, X } from 'lucide-react';
import { useEditProfile, useGetCallerUserProfile, useUpdateProfilePicture, useGetProfilePicture } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

const BIO_MAX = 300;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: currentPictureBytes } = useGetProfilePicture(
    open ? identity?.getPrincipal() : undefined
  );
  const editProfile = useEditProfile();
  const updatePicture = useUpdateProfilePicture();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate with current values whenever dialog opens
  useEffect(() => {
    if (open) {
      if (userProfile?.name) setName(userProfile.name);
      setBio(userProfile?.bio ?? '');
    }
    if (!open) {
      // Reset picture state when dialog closes
      setPictureFile(null);
      if (picturePreview) URL.revokeObjectURL(picturePreview);
      setPicturePreview(null);
      setRemovePicture(false);
    }
  }, [open, userProfile?.name, userProfile?.bio]);

  // Build a blob URL from the current stored picture bytes
  const [storedPictureUrl, setStoredPictureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentPictureBytes && currentPictureBytes.length > 0) {
      const blob = new Blob([new Uint8Array(currentPictureBytes)], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setStoredPictureUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setStoredPictureUrl(null);
    }
  }, [currentPictureBytes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('Image must be smaller than 1 MB.');
      return;
    }
    setPictureFile(file);
    setRemovePicture(false);
    if (picturePreview) URL.revokeObjectURL(picturePreview);
    const url = URL.createObjectURL(file);
    setPicturePreview(url);
  };

  const clearNewPicture = () => {
    setPictureFile(null);
    if (picturePreview) URL.revokeObjectURL(picturePreview);
    setPicturePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveCurrentPicture = () => {
    clearNewPicture();
    setRemovePicture(true);
  };

  const displayedPreview = picturePreview ?? (removePicture ? null : storedPictureUrl);
  const hasPicture = !!displayedPreview;

  const isPending = editProfile.isPending || updatePicture.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const trimmedBio = bio.trim();

    try {
      // Update name and bio — preserve existing counts from the current profile
      await editProfile.mutateAsync({
        name: trimmed,
        bio: trimmedBio.length > 0 ? trimmedBio : undefined,
        profilePicture: userProfile?.profilePicture,
        counts: userProfile?.counts ?? { followers: 0n, following: 0n },
      });

      // Update picture if changed
      if (pictureFile) {
        const buffer = await pictureFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        await updatePicture.mutateAsync(bytes);
      } else if (removePicture) {
        await updatePicture.mutateAsync(null);
      }

      toast.success('Profile updated successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-arena-surface border border-arena-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your artist or creator name, bio, and profile picture.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Profile Picture */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              Profile Picture
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex items-center gap-4">
              {/* Avatar circle */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-arena-neon/40 hover:border-arena-neon/80 transition-colors flex-shrink-0 group focus:outline-none focus:ring-2 focus:ring-arena-neon/40 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Change profile picture"
              >
                {hasPicture ? (
                  <img
                    src={displayedPreview!}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-arena-darker flex items-center justify-center">
                    <Camera className="w-6 h-6 text-arena-neon/50 group-hover:text-arena-neon transition-colors" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>

              <div className="flex-1 min-w-0 space-y-1">
                {pictureFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground truncate">{pictureFile.name}</span>
                    <button
                      type="button"
                      onClick={clearNewPicture}
                      disabled={isPending}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove new picture"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : removePicture ? (
                  <p className="text-sm text-muted-foreground">Picture will be removed on save.</p>
                ) : storedPictureUrl ? (
                  <p className="text-sm text-muted-foreground">Current picture set.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No picture set. Max 1 MB.</p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    className="text-xs text-arena-neon/70 hover:text-arena-neon transition-colors underline underline-offset-2 disabled:opacity-50"
                  >
                    {hasPicture || storedPictureUrl ? 'Change photo' : 'Browse files'}
                  </button>
                  {(storedPictureUrl || pictureFile) && !removePicture && (
                    <button
                      type="button"
                      onClick={handleRemoveCurrentPicture}
                      disabled={isPending}
                      className="text-xs text-destructive/70 hover:text-destructive transition-colors underline underline-offset-2 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isPending}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-sm font-medium text-foreground">
              Display Name
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your artist or creator name"
              disabled={isPending}
              maxLength={60}
              className="bg-arena-darker border-arena-border text-foreground placeholder:text-muted-foreground focus:border-arena-neon/60 focus:ring-arena-neon/20"
              autoFocus
            />
            {name.trim().length === 0 && name.length > 0 && (
              <p className="text-xs text-destructive">Name cannot be empty.</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="profile-bio" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              Bio
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              placeholder="Tell the world about yourself…"
              disabled={isPending}
              rows={3}
              className="bg-arena-darker border-arena-border text-foreground placeholder:text-muted-foreground focus:border-arena-neon/60 focus:ring-arena-neon/20 resize-none"
            />
            <p className={`text-xs text-right ${bio.length >= BIO_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
              {bio.length} / {BIO_MAX}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="border-arena-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || name.trim().length === 0}
              className="bg-arena-neon text-arena-darker hover:bg-arena-neon/90 font-semibold disabled:opacity-50"
            >
              {isPending ? (
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
