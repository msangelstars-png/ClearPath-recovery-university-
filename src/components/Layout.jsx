import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Award, BookOpen, CreditCard, FileArchive, GraduationCap, LifeBuoy, LogOut, Menu, Settings, Sparkles, TrendingUp, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';

const navItems = [
  ['Dashboard', '/dashboard'],
  ['Schools', '/schools'],
  ['Programs', '/programs'],
  ['Pathways', '/pathways'],
  ['Live Classes', '/classes'],
  ['Events', '/events'],
  ['Professors', '/professors'],
  ['AI Chat', '/ai-professors'],
  ['Voice Studio', '/voice-studio'],
  ['Community', '/community'],
  ['Journal', '/journal'],
  ['Docs', '/documents'],
  ['Certificates', '/certificates'],
  ['Support', '/support'],
];

const visitorNavItems = [
  ['Schools', '/schools'],
  ['Programs', '/programs'],
  ['Professors', '/professors'],
  ['Pricing', '/plans'],
];

export function TopNav() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const accountItems = [
    ['My Profile', '/profile', User],
    ['My Progress', '/roadmap', TrendingUp],
    ['My Certificates', '/certificates', Award],
    ['My Documents', '/documents', FileArchive],
    ['Subscription & Billing', '/plans', CreditCard],
    ['Settings', '/settings', Settings],
    ['Support', '/support', LifeBuoy],
  ];

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 max-w-full overflow-x-hidden border-b border-brand-border bg-brand-base/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-4 sm:px-6 lg:px-8">
        <Link to={currentUser ? '/dashboard' : '/'} className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white sm:h-10 sm:w-10">
            <GraduationCap size={22} />
          </span>
          <span className="min-w-0 truncate whitespace-nowrap font-heading text-base font-semibold text-brand-dark xl:text-lg">
            ClearPath<span className="hidden sm:inline"> Recovery University</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0 xl:flex">
          {(currentUser ? navItems : visitorNavItems).map(([label, href]) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-2.5 py-2 text-xs transition-colors 2xl:px-3 2xl:text-sm ${isActive ? 'bg-brand-card text-brand-primary' : 'text-brand-charcoal hover:bg-brand-card'}`
              }
            >
              {label}
            </NavLink>
          ))}
          {currentUser?.role === 'admin' && (
            <NavLink to="/admin" className="whitespace-nowrap rounded-full px-2.5 py-2 text-xs text-brand-charcoal hover:bg-brand-card 2xl:px-3 2xl:text-sm">
              Admin
            </NavLink>
          )}
          {currentUser?.role === 'provider' && (
            <NavLink to="/provider" className="whitespace-nowrap rounded-full px-2.5 py-2 text-xs text-brand-charcoal hover:bg-brand-card 2xl:px-3 2xl:text-sm">
              Provider
            </NavLink>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {!currentUser ? (
            <Button onClick={() => navigate('/auth')} className="rounded-full bg-brand-primary px-5 text-white hover:bg-brand-primaryHover">
              <Sparkles size={16} /> Start
            </Button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-charcoal shadow-sm"
              >
                <UserAvatar user={currentUser} size="sm" />
                <span className="hidden max-w-[120px] truncate sm:inline">{currentUser.display_name}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-brand-border bg-white p-3 shadow-xl">
                  <div className="mb-3 flex items-center gap-3 rounded-xl bg-brand-card p-3">
                    <UserAvatar user={currentUser} size="md" />
                    <div>
                      <p className="font-heading font-medium text-brand-dark">{currentUser.display_name}</p>
                      <p className="text-xs text-brand-muted">{currentUser.email}</p>
                    </div>
                  </div>
                  {accountItems.map(([label, href, Icon]) => (
                    <Link
                      key={href}
                      to={href}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-card"
                    >
                      <Icon size={16} /> {label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-brand-error hover:bg-red-50"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
          <Button variant="ghost" onClick={() => setMobileOpen(!mobileOpen)} className="xl:hidden">
            <Menu size={18} />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-brand-border px-4 py-3 xl:hidden">
          <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
            {(currentUser ? navItems : visitorNavItems).map(([label, href]) => (
              <NavLink
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `max-w-full rounded-full px-3 py-2 text-sm transition-colors ${isActive ? 'bg-brand-card text-brand-primary' : 'text-brand-charcoal hover:bg-brand-card'}`
                }
              >
                {label}
              </NavLink>
            ))}
            {currentUser?.role === 'admin' && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="rounded-full px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-card">
                Admin
              </NavLink>
            )}
            {currentUser?.role === 'provider' && (
              <NavLink to="/provider" onClick={() => setMobileOpen(false)} className="rounded-full px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-card">
                Provider
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function PageShell({ children, eyebrow, title, action }) {
  return (
    <main className="min-h-screen bg-brand-base">
      <TopNav />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {(title || eyebrow || action) && (
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">{eyebrow}</p>}
              {title && <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-dark sm:text-5xl">{title}</h1>}
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
    <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-brand-muted">
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</span>
        {Icon && <Icon size={20} />}
      </div>
      <p className="font-heading text-3xl font-semibold text-brand-dark">{value}</p>
    </div>
  );
}

export function EmptyState({ title, text, cta, to }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-white p-8 text-center">
      <BookOpen className="mx-auto mb-4 text-brand-primary" />
      <h3 className="font-heading text-xl font-medium text-brand-dark">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-brand-muted">{text}</p>
      {cta && (
        <Button asChild className="mt-5 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
          <Link to={to}>{cta}</Link>
        </Button>
      )}
    </div>
  );
}
