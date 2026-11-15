import { Types } from 'mongoose';
import { Distributor } from '../../models/Distributor';
import type { OrgType, Role } from '../../models/roles';
import { Store } from '../../models/Store';
import { toUserDto, User, type UserDoc } from '../../models/User';
import { AppError } from '../../utils/errors';
import { signAccessToken, TOKEN_TTL_SECONDS } from '../../utils/jwt';
import { fakeVerify, hashPassword, verifyPassword } from '../../utils/password';
import type { LoginInput, RegisterDistributorInput, RegisterStoreInput } from './schemas';

const emailTaken = () => new AppError(409, 'CONFLICT', 'Email already registered');
const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

async function loadOrganization(orgType: OrgType, orgId: Types.ObjectId | string) {
  const org = orgType === 'store' ? await Store.findById(orgId) : await Distributor.findById(orgId);
  if (!org) throw new AppError(401, 'UNAUTHORIZED', 'Organization not found');
  return { id: org._id.toString(), type: orgType, name: org.name };
}

/** Builds the `Session` (+ token) response defined in openapi.yaml. */
export async function buildSession(user: UserDoc, withToken = true) {
  const organization = await loadOrganization(user.orgType as OrgType, user.orgId);
  const session = { user: toUserDto(user), organization };
  if (!withToken) return session;
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role as Role,
    orgType: user.orgType as OrgType,
    orgId: user.orgId.toString(),
  });
  return { ...session, accessToken, tokenType: 'Bearer', expiresIn: TOKEN_TTL_SECONDS };
}

/**
 * Creates the organization and its owner. Ids are generated up front because each
 * document references the other; if the owner cannot be created the organization is removed.
 */
async function registerOwner(
  input: { name: string; email: string; password: string },
  role: Role,
  createOrg: (ids: { orgId: Types.ObjectId; userId: Types.ObjectId }) => Promise<unknown>,
) {
  if (await User.exists({ email: input.email })) throw emailTaken();
  const ids = { orgId: new Types.ObjectId(), userId: new Types.ObjectId() };
  const passwordHash = await hashPassword(input.password);

  await createOrg(ids);
  try {
    const user = await User.create({
      _id: ids.userId,
      name: input.name,
      email: input.email,
      passwordHash,
      role,
      orgType: role === 'store_owner' ? 'store' : 'distributor',
      orgId: ids.orgId,
    });
    return buildSession(user);
  } catch (err) {
    if (role === 'store_owner') await Store.deleteOne({ _id: ids.orgId });
    else await Distributor.deleteOne({ _id: ids.orgId });
    throw isDuplicateKey(err) ? emailTaken() : err;
  }
}

export function registerStore(input: RegisterStoreInput) {
  return registerOwner(input, 'store_owner', ({ orgId, userId }) =>
    Store.create({ _id: orgId, owner: userId, ...input.store }),
  );
}

export function registerDistributor(input: RegisterDistributorInput) {
  return registerOwner(input, 'distributor_owner', async ({ orgId, userId }) => {
    if (await Distributor.exists({ nit: input.distributor.nit })) {
      throw new AppError(409, 'CONFLICT', 'NIT already registered');
    }
    return Distributor.create({ _id: orgId, owner: userId, ...input.distributor });
  });
}

/** Same error for unknown email, wrong password and inactive user (no account enumeration). */
export async function login(input: LoginInput) {
  const invalid = new AppError(401, 'UNAUTHORIZED', 'Invalid credentials');
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) {
    await fakeVerify(input.password);
    throw invalid;
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok || !user.active) throw invalid;
  return buildSession(user);
}

export async function me(userId: string) {
  const user = await User.findById(userId);
  if (!user || !user.active) throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  return buildSession(user, false);
}
