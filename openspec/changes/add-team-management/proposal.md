# Proposal: Team management

**Priority:** P0 · **Stories:** US-04 · **QA:** QA-04 · **Screens:** S18 (store team), S24 (distributor team) · **Depends on:** `add-identity-access`

## Why
Owners need to give each employee their own account with a limited role (cashier, inventory clerk, distributor staff) so that every action is traceable and nobody can do more than their job requires.

## What Changes
- Owners create employee accounts with an allowed role for their organization type.
- Owners list their employees and activate/deactivate them; deactivated users can no longer log in or use existing tokens.
- Owners edit their organization profile (`/stores/me`, `/distributors/me`).
- Client: team screens with a "create employee" modal and an active toggle.

## Capabilities

### New Capabilities
- `team-management`: employee accounts per organization, allowed roles per organization type, activation status, organization profile editing.

### Modified Capabilities
None.

## Impact
- API: `/users`, `/users/{id}`, `/stores/me`, `/distributors/me`.
- Reuses `authenticate`, `authorize` and `scopeToOrg` from `add-identity-access`.
- Out of scope: deleting users (deactivation keeps sales/orders history intact), changing an employee's role after creation, invitations by email.
