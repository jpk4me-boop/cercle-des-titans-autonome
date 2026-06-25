import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { usePageViewTracker } from "@/hooks/usePageViewTracker";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import ChatAgent from "@/components/ChatAgent";
import ErrorBoundary from "@/components/ErrorBoundary";
import RoleGuard from "./components/RoleGuard";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const Messages = lazy(() => import("./pages/Messages"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const CategoriesComparison = lazy(() => import("./pages/CategoriesComparison"));
const FondsFinancement = lazy(() => import("./pages/FondsFinancement"));
const BourseRentree = lazy(() => import("./pages/BourseRentree"));
const VerifyReceipt = lazy(() => import("./pages/VerifyReceipt"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ContributionHistory = lazy(() => import("./pages/ContributionHistory"));
const MemberDirectory = lazy(() => import("./pages/MemberDirectory"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Présence en ligne (Phase 4B) : monté une seule fois sous AuthProvider.
// Ne rend rien ; déclenche le heartbeat anonyme/membre.
const PresenceHeartbeat = () => {
  usePresenceHeartbeat();
  return null;
};

// Pages vues (Phase 4C-A) : monté DANS le BrowserRouter (useLocation).
// Ne rend rien ; enregistre une page vue anonyme à chaque changement de route.
const PageViewTracker = () => {
  usePageViewTracker();
  return null;
};

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <PresenceHeartbeat />
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <PageViewTracker />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-use" element={<TermsOfUse />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/callback/google" element={<AuthCallback />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/profile/edit" element={<ProfileEdit />} />

                    <Route path="/categorie/:categoryName" element={<CategoryDetail />} />
                    <Route path="/categories/comparatif" element={<CategoriesComparison />} />
                    <Route path="/financement/fonds-de-financement" element={<FondsFinancement />} />
                    <Route path="/bourse-rentree" element={<BourseRentree />} />
                    <Route path="/verify-receipt" element={<VerifyReceipt />} />
                    <Route path="/historique-cotisations" element={<ContributionHistory />} />

                    <Route
                      path="/admin"
                      element={
                        <RoleGuard allowedRoles={["admin", "super_admin"]}>
                          <AdminDashboard />
                        </RoleGuard>
                      }
                    />

                    <Route
                      path="/super-admin"
                      element={
                        <RoleGuard allowedRoles={["super_admin"]}>
                          <AdminDashboard />
                        </RoleGuard>
                      }
                    />

                    <Route
                      path="/members"
                      element={
                        <RoleGuard allowedRoles={["admin", "super_admin"]}>
                          <MemberDirectory />
                        </RoleGuard>
                      }
                    />

                    <Route
                      path="/members/:id"
                      element={
                        <RoleGuard allowedRoles={["admin", "super_admin"]}>
                          <MemberProfile />
                        </RoleGuard>
                      }
                    />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <ChatAgent />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;