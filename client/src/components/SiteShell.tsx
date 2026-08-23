import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Plus, Sun, Waves } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { ReactNode } from "react";

function Brand() {
  return <Link href="/" className="brand" aria-label="TubeTranscriber home"><span className="brand-mark"><Waves size={17} /></span><span>Tube<span>Transcriber</span></span></Link>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const nav = [{ label: "Home", href: "/" }, { label: "History", href: "/history" }, { label: "About", href: "/about" }, { label: "Blog", href: "/blog" }];
  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner"><Brand /><nav className="desktop-nav" aria-label="Primary navigation">{nav.map(item => <Link key={item.href} href={item.href} className={location === item.href || (item.href === "/blog" && location.startsWith("/blog/")) ? "active" : ""}>{item.label}</Link>)}</nav><div className="nav-actions">{location === "/transcript" && <Link href="/" className="new-transcript-link"><Plus size={15} /> New transcript</Link>}<button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title="Toggle color theme">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button></div></div></header>
    <main>{children}</main>
    <footer className="site-footer"><div className="footer-inner"><Brand /><div className="footer-links"><Link href="/about">About & FAQ</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/copyright">Copyright</Link><Link href="/contact">Contact</Link></div><p>Transcript history remains in your browser. Not affiliated with YouTube or Google.</p></div></footer>
  </div>;
}
