import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Mic2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

const BIO_MAX = 300;

export default function ProfileSetupModal() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("Image must be smaller than 1 MB.");
      return;
    }
    setPictureFile(file);
    const url = URL.createObjectURL(file);
    setPicturePreview(url);
  };

  const clearPicture = () => {
    setPictureFile(null);
    if (picturePreview) URL.revokeObjectURL(picturePreview);
    setPicturePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      let profilePicture: Uint8Array | undefined = undefined;
      if (pictureFile) {
        const buffer = await pictureFile.arrayBuffer();
        profilePicture = new Uint8Array(buffer);
      }
      const trimmedBio = bio.trim();
      await saveProfile({
        name: name.trim(),
        bio: trimmedBio.length > 0 ? trimmedBio : undefined,
        profilePicture,
        counts: { followers: 0n, following: 0n },
      });
      toast.success("Welcome to The Arena!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="bg-arena-surface border-arena-border max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-arena-neon/10 border border-arena-neon/30 flex items-center justify-center neon-glow-sm">
              <Mic2 className="w-8 h-8 text-arena-neon" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-display text-arena-neon neon-text">
            ENTER THE ARENA
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose your artist name to get started. This is how other creators
            will know you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Profile Picture (optional) */}
          <div className="space-y-2">
            <Label className="text-foreground font-semibold flex items-center gap-1.5">
              Profile Picture
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <div className="flex items-center gap-4">
              {/* Avatar preview / placeholder */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-arena-neon/40 hover:border-arena-neon/80 transition-colors flex-shrink-0 group focus:outline-none focus:ring-2 focus:ring-arena-neon/40"
                aria-label="Upload profile picture"
              >
                {picturePreview ? (
                  <img
                    src={picturePreview}
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

              <div className="flex-1 min-w-0">
                {pictureFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground truncate">
                      {pictureFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={clearPicture}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove picture"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click the circle to upload a photo. Max 1 MB.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 text-xs text-arena-neon/70 hover:text-arena-neon transition-colors underline underline-offset-2"
                >
                  {pictureFile ? "Change photo" : "Browse files"}
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Artist Name */}
          <div className="space-y-2">
            <Label
              htmlFor="setup-name"
              className="text-foreground font-semibold"
            >
              Artist / Creator Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="setup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DJ Nova, BeatMaker99…"
              disabled={isPending}
              maxLength={60}
              autoFocus
              className="bg-arena-darker border-arena-border text-foreground placeholder:text-muted-foreground focus:border-arena-neon/60 focus:ring-arena-neon/20"
            />
          </div>

          {/* Bio (optional) */}
          <div className="space-y-2">
            <Label
              htmlFor="setup-bio"
              className="text-foreground font-semibold flex items-center gap-1.5"
            >
              Bio
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="setup-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              placeholder="Tell the world about yourself…"
              disabled={isPending}
              rows={3}
              className="bg-arena-darker border-arena-border text-foreground placeholder:text-muted-foreground focus:border-arena-neon/60 focus:ring-arena-neon/20 resize-none"
            />
            <p
              className={`text-xs text-right ${bio.length >= BIO_MAX ? "text-destructive" : "text-muted-foreground"}`}
            >
              {bio.length} / {BIO_MAX}
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full bg-arena-neon text-arena-darker hover:bg-arena-neon/90 font-bold text-base py-5 rounded-xl shadow-neon disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Setting up your profile…
              </>
            ) : (
              "Enter the Arena"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
