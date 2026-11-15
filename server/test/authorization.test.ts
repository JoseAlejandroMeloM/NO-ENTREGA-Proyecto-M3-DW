import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import '../src/db/connect';
import { authenticate, authorize, orgFilter } from '../src/middleware/auth';
import { errorHandler } from '../src/middleware/error';
import { requireDb } from '../src/middleware/requireDb';
import { User } from '../src/models/User';
import { signAccessToken } from '../src/utils/jwt';
import { hashPassword } from '../src/utils/password';
import { registerStore } from './helpers';

// Test-only app with routes protected the same way feature modules will be.
const testApp = express();
testApp.use(requireDb);
testApp.get('/owner-only', authenticate, authorize('store_owner'), (req, res) => res.json(orgFilter(req)));
testApp.use(errorHandler);

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

async function createCashier(orgId: string) {
  const user = await User.create({
    name: 'Carla Cajera',
    email: 'carla@tienda.co',
    passwordHash: await hashPassword('secret123'),
    role: 'store_cashier',
    orgType: 'store',
    orgId,
  });
  return signAccessToken({ sub: user._id.toString(), role: 'store_cashier', orgType: 'store', orgId });
}

describe('authorization layer', () => {
  it('lets an allowed role through and scopes queries to its organization', async () => {
    const { accessToken, user } = await registerStore();
    const res = await request(testApp).get('/owner-only').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ storeId: user.orgId });
  });

  it('returns 403 for a role that is not allowed', async () => {
    const { user } = await registerStore();
    const cashierToken = await createCashier(user.orgId);
    const res = await request(testApp).get('/owner-only').set('Authorization', `Bearer ${cashierToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects an unsigned token (alg none)', async () => {
    const { user } = await registerStore();
    const now = Math.floor(Date.now() / 1000);
    const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
      sub: user.id, role: 'store_owner', orgType: 'store', orgId: user.orgId,
      iss: 'conecta-negocio-auth', aud: 'conecta-negocio-api', iat: now, exp: now + 900,
    })}.`;
    const res = await request(testApp).get('/owner-only').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with another secret or audience', async () => {
    const { user } = await registerStore();
    const claims = { role: 'store_owner', orgType: 'store', orgId: user.orgId };
    const otherSecret = jwt.sign(claims, 'another-secret-that-is-also-long-enough!!', {
      subject: user.id, issuer: 'conecta-negocio-auth', audience: 'conecta-negocio-api', expiresIn: 900,
    });
    const otherAudience = jwt.sign(claims, process.env.JWT_SECRET!, {
      subject: user.id, issuer: 'conecta-negocio-auth', audience: 'someone-else', expiresIn: 900,
    });
    for (const token of [otherSecret, otherAudience, 'not-a-jwt']) {
      const res = await request(testApp).get('/owner-only').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
    }
  });

  it('rejects an expired token', async () => {
    const { user } = await registerStore();
    const expired = jwt.sign({ role: 'store_owner', orgType: 'store', orgId: user.orgId }, process.env.JWT_SECRET!, {
      subject: user.id, issuer: 'conecta-negocio-auth', audience: 'conecta-negocio-api', expiresIn: -10,
    });
    const res = await request(testApp).get('/owner-only').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
});
