import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Plans = lazy(() => import("./pages/Plans"));
const Profile = lazy(() => import("./pages/Profile"));
const ManageSubscription = lazy(() => import("./pages/ManageSubscription"));
const Recordings = lazy(() => import("./pages/Recordings"));
const Summarizations = lazy(() => import("./pages/Summarizations"));
const Pdfs = lazy(() => import("./pages/Pdfs"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/plans" element={<Plans />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-subscription"
              element={
                <ProtectedRoute>
                  <ManageSubscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recordings"
              element={
                <ProtectedRoute>
                  <Recordings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/summarizations"
              element={
                <ProtectedRoute>
                  <Summarizations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pdfs"
              element={
                <ProtectedRoute>
                  <Pdfs />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
