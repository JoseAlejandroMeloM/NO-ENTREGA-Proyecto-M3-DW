// Mirrors the `Session`, `User` and `Role` schemas in docs/spec/openapi.yaml.
export type Role = 'store_owner' | 'store_inventory' | 'store_cashier' | 'distributor_owner' | 'distributor_staff';
export type OrgType = 'store' | 'distributor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgType: OrgType;
  orgId: string;
  active: boolean;
  createdAt: string;
}

export interface Session {
  user: User;
  organization: { id: string; type: OrgType; name: string };
}

export interface AuthResponse extends Session {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export const STORE_ROLES: Role[] = ['store_owner', 'store_inventory', 'store_cashier'];
export const DISTRIBUTOR_ROLES: Role[] = ['distributor_owner', 'distributor_staff'];

/** Landing page after login for each organization type. */
export const homeFor = (orgType: OrgType) => (orgType === 'store' ? '/app' : '/dist');
