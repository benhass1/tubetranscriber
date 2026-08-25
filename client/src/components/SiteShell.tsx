import { useTheme } from "@/contexts/ThemeContext";
import { Menu, Moon, Plus, Sun, Waves, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState, type ReactNode } from "react";

function Brand() {
  return <Link href="/" className="brand" aria-label="TubeTranscriber home"><span className="brand-mark"><Waves size={17} /></span><span>Tube<span>Transcriber</span></span></Link>;
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const nav = [{ label: "Home", href: "/" }, { label: "History", href: "/history" }, { label: "Blog", href: "/blog" }, { label: "Speed test", href: "/speed-test" }, { label: "About", href: "/about" }];
  const isActive = (href: string) => location === href || (href === "/blog" && location.startsWith("/blog/"));
  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeMobileMenu(); };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) closeMobileMenu();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [mobileMenuOpen]);

  return <div className="app-shell">
    <header className="topbar" ref={headerRef}>
      <div className="topbar-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">{nav.map(item => <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""}>{item.label}</Link>)}</nav>
        <div className="nav-actions">
          {location === "/transcript" && <Link href="/" className="new-transcript-link"><Plus size={15} /> New transcript</Link>}
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title="Toggle color theme">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button type="button" className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(open => !open)} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}>{mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" hidden={!mobileMenuOpen}>
        <div className="mobile-nav-inner">{nav.map(item => <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""} onClick={closeMobileMenu}>{item.label}</Link>)}</div>
      </nav>
    </header>
    <main>{children}</main>
    <footer className="site-footer"><div className="footer-inner"><Brand /><div className="footer-links"><Link href="/about">About & FAQ</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/copyright">Copyright</Link><Link href="/contact">Contact</Link><Link href="/speed-test">Speed test</Link></div><p>Transcript history remains in your browser. Not affiliated with YouTube or Google.</p><span className="author-signal">Maintained by the TubeTranscriber Engineering Team</span></div></footer>
  </div>;
}
