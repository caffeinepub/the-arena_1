import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Loader2, Mic2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const { mutateAsync: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveProfile({ name: name.trim() });
      toast.success('Welcome to The Arena!');
    } catch {
      toast.error('Failed to save profile. Please try again.');
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
            Choose your artist name to get started. This is how other creators will know you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="artist-name" className="text-foreground font-semibold">
              Artist / Creator Name
            </Label>
            <Input
              id="artist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NeonBeat, SynthWave99..."
              className="bg-muted border-arena-border focus:border-arena-neon focus:ring-arena-neon/20 text-foreground placeholder:text-muted-foreground"
              maxLength={50}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full bg-arena-neon text-arena-darker font-bold hover:bg-arena-neon-bright neon-glow-sm disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Enter The Arena'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
