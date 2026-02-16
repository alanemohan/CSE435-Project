import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ScamAnalyzer from "./pages/ScamAnalyzer";
import JobChecker from "./pages/JobChecker";
import ComplaintGenerator from "./pages/ComplaintGenerator";
import Watchlist from "./pages/Watchlist";
import VulnerabilityProfile from "./pages/VulnerabilityProfile";
import VulnerabilityProfilePage from "./pages/VulnerabilityProfilePage";
import EvidenceVault from "./pages/EvidenceVault";
import EducationHub from "./pages/EducationHub";
import CommunityAlerts from "./pages/CommunityAlerts";
import About from "./pages/About";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scam-analyzer" element={<ScamAnalyzer />} />
            <Route path="/job-checker" element={<JobChecker />} />
            <Route path="/complaint-generator" element={<ComplaintGenerator />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/vulnerability-profile" element={<VulnerabilityProfile />} />
            <Route path="/vulnerability-analysis" element={<VulnerabilityProfilePage />} />
            <Route path="/evidence-vault" element={<EvidenceVault />} />
            <Route path="/education-hub" element={<EducationHub />} />
            <Route path="/community-alerts" element={<CommunityAlerts />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
