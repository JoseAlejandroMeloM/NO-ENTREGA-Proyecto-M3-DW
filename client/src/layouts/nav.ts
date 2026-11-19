import {
  Bell,
  BookOpen,
  Building2,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  Package,
  PackagePlus,
  Receipt,
  Scale,
  ShoppingBasket,
  Store,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../types/auth';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Sidebar section title; items without one sit at the top. */
  group?: string;
  roles: Role[];
  /** Shows a count next to the label; 'restock' = products to restock (add-restock-alerts). */
  badge?: 'restock';
}

// Navigation per role (screens in docs/spec/06-screens.md). The order matters: on phones the first
// items fill the bottom bar and the rest go under "More".
export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, roles: ['store_owner', 'store_inventory', 'store_cashier'] },
  { to: '/app/sales/new', label: 'New sale', icon: ShoppingBasket, group: 'Sell', roles: ['store_owner', 'store_cashier'] },
  { to: '/app/sales', label: 'Sales', icon: Receipt, group: 'Sell', roles: ['store_owner', 'store_inventory', 'store_cashier'] },
  { to: '/app/products', label: 'Products', icon: Package, group: 'Stock', roles: ['store_owner', 'store_inventory', 'store_cashier'] },
  { to: '/app/insights', label: 'Insights', icon: ChartColumn, group: 'Stock', roles: ['store_owner', 'store_inventory'] },
  { to: '/app/restock', label: 'Restock', icon: PackagePlus, group: 'Stock', roles: ['store_owner', 'store_inventory'], badge: 'restock' },
  { to: '/app/orders', label: 'Orders', icon: ClipboardList, group: 'Suppliers', roles: ['store_owner', 'store_inventory'] },
  { to: '/app/distributors', label: 'Distributors', icon: Truck, group: 'Suppliers', roles: ['store_owner', 'store_inventory'] },
  { to: '/app/compare', label: 'Compare', icon: Scale, group: 'Suppliers', roles: ['store_owner', 'store_inventory'] },
  { to: '/app/team', label: 'Team', icon: Users, group: 'Manage', roles: ['store_owner'] },
  { to: '/app/profile', label: 'Store profile', icon: Store, group: 'Manage', roles: ['store_owner'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, group: 'Manage', roles: ['store_owner', 'store_inventory', 'store_cashier'] },
  { to: '/dist', label: 'Dashboard', icon: LayoutDashboard, roles: ['distributor_owner', 'distributor_staff'] },
  { to: '/dist/orders', label: 'Orders', icon: ClipboardList, roles: ['distributor_owner', 'distributor_staff'] },
  { to: '/dist/catalog', label: 'Catalog', icon: BookOpen, roles: ['distributor_owner', 'distributor_staff'] },
  { to: '/dist/team', label: 'Team', icon: Users, group: 'Manage', roles: ['distributor_owner'] },
  { to: '/dist/profile', label: 'Company profile', icon: Building2, group: 'Manage', roles: ['distributor_owner'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, group: 'Manage', roles: ['distributor_owner', 'distributor_staff'] },
];

export const ROLE_LABEL: Record<Role, string> = {
  store_owner: 'Store owner',
  store_inventory: 'Inventory clerk',
  store_cashier: 'Cashier',
  distributor_owner: 'Distributor owner',
  distributor_staff: 'Distributor staff',
};
