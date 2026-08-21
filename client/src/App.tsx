import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import History from "./pages/History";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Transcript from "./pages/Transcript";
import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { useLocation } from "wouter";

function PageTitle() {
  const [location] = useLocation();
  useEffect(() => {
    const labels: Record<string, string> = { "/": "YouTube Transcript Extractor", "/history": "Transcript History", "/about": "About & FAQ", "/transcript": "Transcript Viewer" };
    document.title = `${labels[location] ?? "TubeTranscriber"} | TubeTranscriber`;
  }, [location]);
  return null;
}

function Router() { return <><PageTitle /><Switch><Route path="/" component={Home} /><Route path="/transcript" component={Transcript} /><Route path="/history" component={History} /><Route path="/about" component={About} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
