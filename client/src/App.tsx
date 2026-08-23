import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { HYDRATION_SAFE_DEFAULT_THEME, ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import History from "./pages/History";
import Home from "./pages/Home";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import Transcript from "./pages/Transcript";

function PageTitle() {
  const [location] = useLocation();
  useEffect(() => {
    const labels: Record<string, string> = {
      "/": "YouTube to Transcript Generator",
      "/history": "Local Transcript History",
      "/about": "About, FAQ, and Caption Guide",
      "/blog": "TubeTranscriber Blog",
      "/transcript": "YouTube Transcript Reader",
      "/privacy": "Privacy Policy",
      "/terms": "Terms of Service",
      "/copyright": "Copyright and DMCA",
      "/contact": "Contact",
    };
    const label = location.startsWith("/blog/") ? "TubeTranscriber Blog" : labels[location] ?? "TubeTranscriber";
    document.title = `${label} | TubeTranscriber`;
  }, [location]);
  return null;
}

const Privacy = () => <LegalPage kind="privacy" />;
const Terms = () => <LegalPage kind="terms" />;
const Copyright = () => <LegalPage kind="copyright" />;
const Contact = () => <LegalPage kind="contact" />;

function Router() {
  return (
    <>
      <PageTitle />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/transcript" component={Transcript} />
        <Route path="/history" component={History} />
        <Route path="/about" component={About} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/blog" component={Blog} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/copyright" component={Copyright} />
        <Route path="/contact" component={Contact} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme={HYDRATION_SAFE_DEFAULT_THEME} switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
