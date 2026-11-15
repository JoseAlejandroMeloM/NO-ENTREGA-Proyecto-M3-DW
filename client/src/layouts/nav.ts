import type { Role } from '../types/auth';

export interface NavItem {
  to: string;
  label: string;
  roles: Role[];
}

// Sidebar items per role (screens in docs/spec/06-screens.md). Items are added as features ship.
export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Dashboard', roles: ['store_owner', 'store_inventory', 'store_cashier'] },
  { to: '/app/sales/new', label: 'New sale', roles: ['store_owner', 'store_cashier'] },
  { to: '/app/sales', label: 'Sales', roles: ['store_owner', 'store_inventory', 'store_cashier'] },
  { to: '/app/products', label: 'Products', roles: ['store_owner', 'store_inventory', 'store_cashier'] },
  { to: '/app/team', label: 'Team', roles: ['store_owner'] },
  { to: '/app/profile', label: 'Store profile', roles: ['store_owner'] },
  { to: '/notifications', label: 'Notifications', roles: ['store_owner', 'store_inventory', 'store_cashier'] },
  { to: '/dist', label: 'Dashboard', roles: ['distributor_owner', 'distributor_staff'] },
  { to: '/dist/team', label: 'Team', roles: ['distributor_owner'] },
  { to: '/dist/profile', label: 'Company profile', roles: ['distributor_owner'] },
  { to: '/notifications', label: 'Notifications', roles: ['distributor_owner', 'distributor_staff'] },
];

export const ROLE_LABEL: Record<Role, string> = {
  store_owner: 'Store owner',
  store_inventory: 'Inventory clerk',
  store_cashier: 'Cashier',
  distributor_owner: 'Distributor owner',
  distributor_staff: 'Distributor staff',
};
