export const ROLES = ['store_owner', 'store_inventory', 'store_cashier', 'distributor_owner', 'distributor_staff'] as const;
export type Role = (typeof ROLES)[number];

export const ORG_TYPES = ['store', 'distributor'] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export const STORE_ROLES: readonly Role[] = ['store_owner', 'store_inventory', 'store_cashier'];
export const DISTRIBUTOR_ROLES: readonly Role[] = ['distributor_owner', 'distributor_staff'];

export const orgTypeOf = (role: Role): OrgType => (STORE_ROLES.includes(role) ? 'store' : 'distributor');
