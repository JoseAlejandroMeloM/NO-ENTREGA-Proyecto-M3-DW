import { useAuth } from './useAuth';

/** Owner and inventory clerk can write products; cashiers only read (US-10 AC3). UX only — the API enforces it. */
export function useCanManageInventory() {
  const role = useAuth().session?.user.role;
  return role === 'store_owner' || role === 'store_inventory';
}
