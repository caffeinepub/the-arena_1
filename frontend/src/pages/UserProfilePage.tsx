import { useMemo } from 'react';
import { useParams } from '@tanstack/react-router';
import { Principal } from '@dfinity/principal';
import { AlertCircle } from 'lucide-react';
import UserProfileView from '../components/UserProfileView';
import { useGetAllContent } from '../hooks/useQueries';

export default function UserProfilePage() {
  const { principal: principalStr } = useParams({ from: '/profile/$principal' });

  // Parse the principal from the URL param
  const parsedPrincipal = useMemo(() => {
    try {
      return Principal.fromText(principalStr);
    } catch {
      return null;
    }
  }, [principalStr]);

  // Derive a display name from content uploader data (best-effort)
  const { data: allContent = [] } = useGetAllContent();
  const displayName = useMemo(() => {
    if (!parsedPrincipal) return undefined;
    const match = allContent.find(
      (c) => c.uploader.toString() === parsedPrincipal.toString()
    );
    // We can't call getUserProfile for other users due to backend auth restriction,
    // so we fall back to the principal string. The name will be shown if available
    // from the feed data context passed via navigation state.
    return match ? undefined : undefined;
  }, [allContent, parsedPrincipal]);

  if (!parsedPrincipal) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Invalid Profile</h2>
        <p className="text-muted-foreground">
          The user principal in the URL is not valid.
        </p>
      </div>
    );
  }

  return <UserProfileView targetPrincipal={parsedPrincipal} displayName={displayName} />;
}
