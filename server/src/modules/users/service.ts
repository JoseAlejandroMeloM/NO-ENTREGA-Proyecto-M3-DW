import type { AuthUser } from '../../middleware/auth';
import type { Role } from '../../models/roles';
import { toUserDto, User } from '../../models/User';
import { AppError, notFoundError } from '../../utils/errors';
import { hashPassword } from '../../utils/password';
import type { CreateEmployeeInput } from './schemas';

// Roles each owner may create (US-04 AC1).
const ALLOWED: Partial<Record<Role, Role[]>> = {
  store_owner: ['store_inventory', 'store_cashier'],
  distributor_owner: ['distributor_staff'],
};

export async function listTeam(owner: AuthUser) {
  const users = await User.find({ orgId: owner.orgId }).sort({ createdAt: 1 });
  return { data: users.map(toUserDto) };
}

export async function createEmployee(owner: AuthUser, input: CreateEmployeeInput) {
  if (!ALLOWED[owner.role]?.includes(input.role)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request data', [
      { path: 'role', message: `A ${owner.orgType} owner cannot create the role ${input.role}` },
    ]);
  }
  if (await User.exists({ email: input.email })) throw new AppError(409, 'CONFLICT', 'Email already registered');

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      orgType: owner.orgType,
      orgId: owner.orgId,
    });
    return toUserDto(user);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw new AppError(409, 'CONFLICT', 'Email already registered');
    throw err;
  }
}

/** Activate or deactivate a member of the owner's organization (US-04 AC2). */
export async function setActive(owner: AuthUser, userId: string, active: boolean) {
  if (userId === owner.id) throw new AppError(409, 'CONFLICT', 'You cannot deactivate your own account');
  // Filtering by orgId means users of other organizations look like they do not exist.
  const user = await User.findOneAndUpdate({ _id: userId, orgId: owner.orgId }, { active }, { new: true });
  if (!user) throw notFoundError('User');
  return toUserDto(user);
}
