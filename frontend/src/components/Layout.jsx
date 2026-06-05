import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, LogOut, Menu, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Schools", "/schools"],
  ["AI Professors", "/ai-professors"],
  ["Journal", "/journal"],
  ["Roadmap", "/roadmap"],
  ["Certificates", "/certificates"],
  ["Support", "/support"],
];

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-brand-base/95 backdrop-blur-md" data-testid="top-navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3" data-testid="brand-home-link">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white"><GraduationCap size={22} /></span>
          <span className="font-heading text-lg font-semibold text-brand-dark">ClearPath Recovery University</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" data-testid="desktop-navigation-links">
          {user && navItems.map(([label, href]) => (
            <NavLink key={href} to={href} data-testid={`nav-link-${label.toLowerCase().replaceAll(" ", "-")}`} className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition-colors ${isActive ? "bg-brand-card text-brand-primary" : "text-brand-charcoal hover:bg-brand-card"}`}>{label}</NavLink>
          ))}
          {user?.role === "admin" && <NavLink to="/admin" data-testid="nav-link-admin" className="rounded-full px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-card">Admin</NavLink>}
        </nav>
        <div className="flex items-center gap-2">
          {!user ? (
            <Button onClick={() => navigate("/auth")} data-testid="nav-start-button" className="rounded-full bg-brand-primary px-5 text-white hover:bg-brand-primaryHover"><Sparkles size={16} /> Start</Button>
          ) : (
            <Button variant="outline" onClick={() => { logout(); navigate("/"); }} data-testid="logout-button" className="rounded-full border-brand-border bg-white"><LogOut size={16} /> Logout</Button>
          )}
          {user && <Button variant="ghost" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-button" className="lg:hidden"><Menu size={18} /></Button>}
        </div>
      </div>
      {user && mobileOpen && (
        <nav className="border-t border-brand-border px-4 py-3 lg:hidden" data-testid="mobile-navigation-links">
          <div className="flex flex-wrap gap-2">
            {navItems.map(([label, href]) => (
              <NavLink key={href} to={href} onClick={() => setMobileOpen(false)} data-testid={`mobile-nav-link-${label.toLowerCase().replaceAll(" ", "-")}`} className={({ isActive }) => `rounded-full px-3 py-2 text-sm transition-colors ${isActive ? "bg-brand-card text-brand-primary" : "text-brand-charcoal hover:bg-brand-card"}`}>{label}</NavLink>
            ))}
            {user?.role === "admin" && <NavLink to="/admin" onClick={() => setMobileOpen(false)} data-testid="mobile-nav-link-admin" className="rounded-full px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-card">Admin</NavLink>}
          </div>
        </nav>
      )}
    </header>
  );
}

export function PageShell({ children, eyebrow, title, action }) {
  return (
    <main className="min-h-screen bg-brand-base" data-testid="page-shell">
      <TopNav />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {(title || eyebrow || action) && (
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-testid="page-header">
            <div>
              {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted" data-testid="page-eyebrow">{eyebrow}</p>}
              {title && <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-dark sm:text-5xl" data-testid="page-title">{title}</h1>}
            </div>
            {action}
          </div>
        )}
        {children}
      </section>
    </main>
  );
}

export function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm" data-testid={`stat-${label.toLowerCase().replaceAll(" ", "-")}`}>
      <div className="mb-4 flex items-center justify-between text-brand-muted">
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</span>
        {Icon && <Icon size={20} />}
      </div>
      <p className="font-heading text-3xl font-semibold text-brand-dark" data-testid={`stat-value-${label.toLowerCase().replaceAll(" ", "-")}`}>{value}</p>
    </div>
  );
}

export function EmptyState({ title, text, cta, to }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-white p-8 text-center" data-testid="empty-state">
      <BookOpen className="mx-auto mb-4 text-brand-primary" />
      <h3 className="font-heading text-xl font-medium text-brand-dark" data-testid="empty-state-title">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-brand-muted" data-testid="empty-state-text">{text}</p>
      {cta && <Button asChild data-testid="empty-state-action" className="mt-5 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Link to={to}>{cta}</Link></Button>}
    </div>
  );
}