import { Store, Truck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const OPTIONS = [
  { to: '/register/store', label: 'Store', icon: Store },
  { to: '/register/distributor', label: 'Distributor', icon: Truck },
];

/** Switch between the two registration screens (S03 / S04). Plain links, so each form keeps its own route. */
export default function RegisterSwitch() {
  return (
    <nav aria-label="Account type" className="inline-grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card">
      {OPTIONS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          replace
          className={({ isActive }) =>
            `flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors ${
              isActive ? 'bg-primary-soft text-primary-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
