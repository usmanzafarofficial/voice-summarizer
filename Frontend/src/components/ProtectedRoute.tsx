import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { confirmCheckout } from "@/lib/api";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, isReady } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!isReady) return;

      if (!user || !token) {
        setChecking(false);
        return;
      }

      const params = new URLSearchParams(location.search);
      const paymentStatus = params.get("payment");
      const sessionId = params.get("session_id");

      // If returning from Stripe checkout, confirm the session and create subscription
      if (paymentStatus === "success" && sessionId) {
        try {
          await confirmCheckout(sessionId, token);
        } catch (err) {
          console.error("Failed to confirm checkout session", err);
        }

        // Clean up URL params
        params.delete("payment");
        params.delete("session_id");
        const newSearch = params.toString();
        const newUrl =
          location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, "", newUrl);
      }

      setChecking(false);
    }

    checkAccess();
  }, [isReady, user, token, location.pathname, location.search]);

  if (!isReady || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/?login=1" state={{ from: location }} replace />;
  }

  // Allow access for all authenticated users - free tier gets 1 voice, 1 PDF, 1 summary
  return <>{children}</>;
}
