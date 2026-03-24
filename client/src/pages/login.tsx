import { useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoginPageProps {
  onLogin: (user: { email: string; name: string; picture: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const initGoogleSignIn = useCallback(async () => {
    try {
      // Fetch the client ID from the backend
      const res = await fetch("/api/auth/client-id");
      const { clientId } = await res.json();

      if (!clientId) {
        console.error("Google Client ID not configured");
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          {
            theme: "outline",
            size: "large",
            width: 320,
            text: "signin_with",
            shape: "rectangular",
          }
        );
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error("Failed to init Google Sign-In:", err);
    }
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else {
        const err = await res.json();
        alert(err.message || "Login failed");
      }
    } catch (err) {
      alert("Login failed. Please try again.");
    }
  };

  useEffect(() => {
    initGoogleSignIn();
  }, [initGoogleSignIn]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[400px] border-border/50">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Balaji Agent Hub Logo */}
          <div className="flex justify-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Balaji Agent Hub Logo"
            >
              <rect
                x="4"
                y="4"
                width="40"
                height="40"
                rx="8"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-primary"
              />
              <circle cx="16" cy="24" r="4" fill="currentColor" className="text-primary" />
              <circle cx="32" cy="16" r="4" fill="currentColor" className="text-primary" />
              <circle cx="32" cy="32" r="4" fill="currentColor" className="text-primary" />
              <line x1="19.5" y1="22.5" x2="28.5" y2="17.5" stroke="currentColor" strokeWidth="2" className="text-primary" />
              <line x1="19.5" y1="25.5" x2="28.5" y2="30.5" stroke="currentColor" strokeWidth="2" className="text-primary" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Balaji Agent Hub</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Job Agent Dashboard
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pt-4 pb-8">
          <p className="text-sm text-muted-foreground text-center">
            Sign in with your Google account to access the dashboard.
          </p>
          <div id="google-signin-btn" data-testid="button-google-signin" />
        </CardContent>
      </Card>
    </div>
  );
}
