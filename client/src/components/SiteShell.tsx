import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { FileText, LogOut, Moon, Sun, Waves } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { ReactNode } from "react";

function Brand() {
  return <Link href="/" className="brand" aria-label="TubeTranscriber home"><span className="brand-mark"><Waves size={17} /></span><span>Tube<span>Transcriber</span></span></Link>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const nav = [{ label: "Home", href: "/" }, { label: "History", href: "/history" }, { label: "About", href: "/about" }];

  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner"><Brand /><nav className="desktop-nav" aria-label="Primary navigation">{nav.map(item => <Link key={item.href} href={item.href} className={location === item.href ? "active" : ""}>{item.label}</Link>)}</nav><div className="nav-actions"><button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title="Toggle color theme">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>{loading ? <div className="avatar-placeholder" /> : isAuthenticated ? <div className="account-area"><span className="account-name">{user?.name?.split(" ")[0] || "Account"}</span><button className="signout-button" onClick={() => logout()}><LogOut size={15} /><span>Sign out</span></button></div> : <button className="login-button" onClick={() => startLogin()}><FileText size={15} />Sign in</button>}</div></div></header>
    <main>{children}</main>
    <footer className="site-footer"><div className="footer-inner"><Brand /><div className="footer-links"><Link href="/about">About & FAQ</Link><a href="https://www.youtube.com" target="_blank" rel="noreferrer">YouTube</a></div><p>Made for clear captions. Not affiliated with YouTube or Google.</p></div></footer>
  </div>;
}
