import { Ellipsis, LogOut } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Logo from '../components/Logo';
import Modal from '../components/Modal';
import NotificationBell from '../components/notifications/NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { useRestockCount } from '../hooks/useRestockCount';
import { homeFor } from '../types/auth';
import { NAV_ITEMS, ROLE_LABEL, type NavItem } from './nav';
import PreferenceToggles from '../components/PreferenceToggles';

// These match their exact path only, so "Sales" is not highlighted while on "New sale".
const isExact = (item: NavItem) => item.to === '/app' || item.to === '/dist' || item.to === '/app/sales';

const BAR_ITEM = 'flex min-w-0 flex-col items-center gap-0.5 px-1 pt-2 pb-1.5 text-[0.6875rem] font-medium -outline-offset-2';
const BAR_ICON = 'grid h-7 w-12 place-items-center rounded-full transition-colors';

/** Count pill next to a nav label (same look as the bell's unread count). Hidden at 0. */
function NavBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span key={count} className="pop ml-auto min-w-5 rounded-full bg-accent px-1.5 text-center text-xs leading-5 font-semibold text-black">
      {count > 99 ? '99+' : count}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

/** Shell for every logged-in screen: role-based sidebar and top bar; on phones the sidebar becomes a bottom bar. */
export default function AppLayout() {
  const { session, logout } = useAuth();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const restockCount = useRestockCount();
  if (!session) return null;
  const { user, organization } = session;
  const home = homeFor(organization.type);
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));
  // Phones: five items fit in the bottom bar. With more, the first four stay and the rest go under "More".
  const barItems = items.length <= 5 ? items : items.slice(0, 4);
  const moreItems = items.slice(barItems.length);
  const inMore = moreItems.some((i) => pathname.startsWith(i.to));
  const badgeFor = (item: NavItem) =>
    item.badge === 'restock' ? <NavBadge count={restockCount} label={restockCount === 1 ? 'product to restock' : 'products to restock'} /> : null;
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0]) // Array.from keeps an emoji or accented letter whole
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-sm font-medium shadow-raised focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col bg-primary-deep md:flex">
        <Link to={home} className="flex h-16 shrink-0 items-center px-5 focus-visible:outline-accent">
          <Logo onDark />
        </Link>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
          {items.map((item, i) => (
            <Fragment key={item.to}>
              {item.group && item.group !== items[i - 1]?.group && (
                <p className="mt-5 mb-1 px-3 text-[0.6875rem] font-semibold tracking-wider text-on-deep/65 uppercase">{item.group}</p>
              )}
              <NavLink
                to={item.to}
                end={isExact(item)}
                className={({ isActive }) =>
                  `mt-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-accent ${
                    isActive ? 'bg-white/12 text-white' : 'text-on-deep/85 hover:bg-white/6 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-[1.125rem] w-[1.125rem] shrink-0 ${isActive ? 'text-accent' : ''}`} aria-hidden="true" />
                    {item.label}
                    {badgeFor(item)}
                  </>
                )}
              </NavLink>
            </Fragment>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-surface px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link to={home} className="md:hidden">
              <Logo compact />
            </Link>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold tracking-tight">{organization.name}</p>
              <p className="truncate text-xs text-slate-600">
                {user.name} · {ROLE_LABEL[user.role]}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PreferenceToggles />
            <NotificationBell />
            <span aria-hidden="true" className="hidden h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-dark sm:grid">
              {initials}
            </span>
            <Button variant="secondary" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Log out</span>
            </Button>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-12">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid auto-cols-fr grid-flow-col border-t border-slate-200 bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {barItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={isExact(item)}
            className={({ isActive }) => `${BAR_ITEM} ${isActive ? 'text-primary-dark' : 'text-slate-600'}`}
          >
            {({ isActive }) => (
              <>
                <span className={`${BAR_ICON} ${isActive ? 'bg-primary-soft' : ''}`}>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {moreItems.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={`${BAR_ITEM} ${inMore ? 'text-primary-dark' : 'text-slate-600'}`}
          >
            <span className={`relative ${BAR_ICON} ${inMore ? 'bg-primary-soft' : ''}`}>
              <Ellipsis className="h-5 w-5" aria-hidden="true" />
              {/* Phones: Restock usually sits under "More", so a dot tells there is something to restock. */}
              {restockCount > 0 && moreItems.some((i) => i.badge === 'restock') && (
                <span className="absolute top-0.5 right-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white" aria-hidden="true" />
              )}
            </span>
            More
          </button>
        )}
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <nav aria-label="More pages" className="-mx-2 grid gap-0.5">
          {moreItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                `flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium -outline-offset-2 ${
                  isActive ? 'bg-primary-soft text-primary-dark' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.label}
              {badgeFor(item)}
            </NavLink>
          ))}
        </nav>
      </Modal>
    </div>
  );
}
