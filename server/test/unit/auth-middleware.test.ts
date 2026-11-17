// Unit tests: no database and no HTTP server. Express's req/res/next and the User lookup are mocks,
// so each test checks one decision of the middleware in isolation (Arrange → Act → Assert).
import type { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticate, authorize, orgFilter, type AuthUser } from '../../src/middleware/auth';
import { User } from '../../src/models/User';
import { signAccessToken } from '../../src/utils/jwt';

const owner: AuthUser = { id: 'u1', name: 'Rosa', role: 'store_owner', orgType: 'store', orgId: 'store1' };
const fakeReq = (extra: Partial<Request> = {}) => ({ headers: {}, ...extra }) as Request;
const res = {} as Response;

afterEach(() => vi.restoreAllMocks());

describe('authorize (role check)', () => {
  it('calls next() with no error when the role is allowed', () => {
    // Arrange
    const req = fakeReq({ user: owner });
    const next = vi.fn<NextFunction>();
    // Act
    authorize('store_owner', 'store_inventory')(req, res, next);
    // Assert
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('passes a 403 FORBIDDEN error when the role is not allowed', () => {
    const req = fakeReq({ user: { ...owner, role: 'store_cashier' } });
    const next = vi.fn<NextFunction>();

    authorize('store_owner')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403, code: 'FORBIDDEN' }));
  });

  it('passes a 401 when there is no logged-in user', () => {
    const next = vi.fn<NextFunction>();

    authorize('store_owner')(fakeReq(), res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }));
  });
});

describe('orgFilter (tenant isolation)', () => {
  it('limits a store user to their store', () => {
    expect(orgFilter(fakeReq({ user: owner }))).toEqual({ storeId: 'store1' });
  });

  it('limits a distributor user to their distributor', () => {
    const user: AuthUser = { ...owner, role: 'distributor_staff', orgType: 'distributor', orgId: 'dist1' };
    expect(orgFilter(fakeReq({ user }))).toEqual({ distributorId: 'dist1' });
  });
});

describe('authenticate (bearer token)', () => {
  const token = () => signAccessToken({ sub: 'u1', role: 'store_owner', orgType: 'store', orgId: 'store1' });

  it('rejects a request without a token and never queries the database', async () => {
    // Arrange: spy on the database lookup to prove it is not reached.
    const findById = vi.spyOn(User, 'findById');
    const next = vi.fn<NextFunction>();
    // Act
    await authenticate(fakeReq(), res, next);
    // Assert
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    expect(findById).not.toHaveBeenCalled();
  });

  it('loads the user from a valid token and sets req.user', async () => {
    // Arrange: the database is mocked to return an active user.
    const dbUser = { _id: 'u1', name: 'Rosa', role: 'store_owner', orgType: 'store', orgId: 'store1', active: true };
    vi.spyOn(User, 'findById').mockResolvedValue(dbUser as never);
    const req = fakeReq({ headers: { authorization: `Bearer ${token()}` } });
    const next = vi.fn<NextFunction>();
    // Act
    await authenticate(req, res, next);
    // Assert
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(owner);
  });

  it('locks out a deactivated user even with a valid token', async () => {
    vi.spyOn(User, 'findById').mockResolvedValue({ _id: 'u1', active: false } as never);
    const next = vi.fn<NextFunction>();

    await authenticate(fakeReq({ headers: { authorization: `Bearer ${token()}` } }), res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('rejects a tampered token', async () => {
    const next = vi.fn<NextFunction>();

    await authenticate(fakeReq({ headers: { authorization: `Bearer ${token()}x` } }), res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });
});
