import { NavLink, Outlet } from 'react-router-dom';
import Button from '../components/Button';
import NotificationBell from '../components/notifications/NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { NAV_ITEMS, ROLE_LABEL } from './nav';

/** Shell for every logged-in screen: top bar + role-based sidebar (bottom bar on mobile). */
export default function AppLayout() {
  const { session, logout } = useAuth();
  if (!session) return null;
  const { user, organization } = session;
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-56 md:border-r md:border-b-0">
        <p className="px-4 py-4 text-lg font-bold text-primary">Conecta Negocio</p>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-primary-soft text-primary-dark' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{organization.name}</p>
            <p className="text-xs text-slate-500">
              {user.name} · {ROLE_LABEL[user.role]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
