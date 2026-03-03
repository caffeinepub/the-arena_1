import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  if (isLoggingIn) {
    return (
      <Button
        disabled
        variant="outline"
        size="sm"
        className="border-arena-neon/30 text-arena-neon"
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Logging in...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        onClick={handleAuth}
        variant="outline"
        size="sm"
        className="border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAuth}
      size="sm"
      className="bg-arena-neon text-arena-darker font-bold hover:bg-arena-neon-bright neon-glow-sm transition-all"
    >
      <LogIn className="w-4 h-4 mr-2" />
      Login
    </Button>
  );
}
