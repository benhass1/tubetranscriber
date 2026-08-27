import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import SiteSeo from "./components/SiteSeo";
import { HYDRATION_SAFE_DEFAULT_THEME, ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import History from "./pages/History";
import Home from "./pages/Home";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import Transcript from "./pages/Transcript";
import SpeedTest from "./pages/SpeedTest";
import PseoPage from "./pages/PseoPage";

const Privacy = () => <LegalPage kind="privacy" />;
const Terms = () => <LegalPage kind="terms" />;
const Copyright = () => <LegalPage kind="copyright" />;
const Contact = () => <LegalPage kind="contact" />;

function ScrollToLocation() {
  const [location] = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const rawHash = window.location.hash.slice(1);
      if (rawHash) {
        const target = document.getElementById(decodeURIComponent(rawHash));
        if (target) {
          const headerHeight = document.querySelector<HTMLElement>(".topbar")?.offsetHeight ?? 0;
          const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
          window.scrollTo({ top: Math.max(0, targetTop), left: 0, behavior: "auto" });
          return;
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToLocation />
      <SiteSeo />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/transcript" component={Transcript} />
        <Route path="/speed-test" component={SpeedTest} />
        <Route path="/transcribe-youtube-podcast-to-srt" component={PseoPage} />
        <Route path="/youtube-shorts-transcript-downloader" component={PseoPage} />
        <Route path="/extract-lecture-captions-to-text" component={PseoPage} />
        <Route path="/youtube-video-to-json-data" component={PseoPage} />
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
