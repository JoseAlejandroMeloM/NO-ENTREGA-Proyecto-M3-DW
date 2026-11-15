import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { Store } from '../src/models/Store';
import { User } from '../src/models/User';
import { distributorOwnerInput, registerStore, storeOwnerInput } from './helpers';

describe('POST /api/auth/register-store', () => {
  it('creates the store and its owner and logs in', async () => {
    const res = await request(app).post('/api/auth/register-store').send(storeOwnerInput());
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
    expect(res.body.user).toMatchObject({ role: 'store_owner', orgType: 'store', email: 'ana@tienda.co', active: true });
    expect(res.body.organization).toMatchObject({ type: 'store', name: 'Tienda Ana', id: res.body.user.orgId });
  });

  it('never exposes the password or its hash', async () => {
    const res = await request(app).post('/api/auth/register-store').send(storeOwnerInput());
    expect(JSON.stringify(res.body)).not.toMatch(/secret123|passwordHash|\$2[aby]\$/);
    const stored = await User.findOne({ email: 'ana@tienda.co' }).select('+passwordHash');
    expect(stored!.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('rejects a weak password with a field detail', async () => {
    const res = await request(app).post('/api/auth/register-store').send(storeOwnerInput({ password: 'abcdefgh' }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ path: 'password' }));
  });

  it('rejects a duplicate email without creating a second store', async () => {
    await registerStore();
    const res = await request(app)
      .post('/api/auth/register-store')
      .send(storeOwnerInput({ email: 'ANA@tienda.co', store: { name: 'Otra', address: 'x', phone: '3000000000' } }));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: 'Email already registered' });
    expect(await Store.countDocuments()).toBe(1);
  });
});

describe('POST /api/auth/register-distributor', () => {
  it('creates the distributor owner', async () => {
    const res = await request(app).post('/api/auth/register-distributor').send(distributorOwnerInput());
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ role: 'distributor_owner', orgType: 'distributor' });
    expect(res.body.organization.type).toBe('distributor');
  });

  it('rejects a duplicate NIT', async () => {
    await request(app).post('/api/auth/register-distributor').send(distributorOwnerInput());
    const res = await request(app)
      .post('/api/auth/register-distributor')
      .send(distributorOwnerInput({ email: 'other@distri.co' }));
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token and the profile for valid credentials', async () => {
    await registerStore();
    const res = await request(app).post('/api/auth/login').send({ email: 'ana@tienda.co', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.role).toBe('store_owner');
  });

  it('uses the same message for unknown email and wrong password', async () => {
    await registerStore();
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@x.co', password: 'secret123' });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'ana@tienda.co', password: 'wrong123' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error.message).toBe('Invalid credentials');
    expect(wrong.body.error.message).toBe('Invalid credentials');
  });

  it('rejects a deactivated user', async () => {
    await registerStore();
    await User.updateOne({ email: 'ana@tienda.co' }, { active: false });
    const res = await request(app).post('/api/auth/login').send({ email: 'ana@tienda.co', password: 'secret123' });
    expect(res.status).toBe(401);
    expect(res.body.accessToken).toBeUndefined();
  });

  it('does not let query operators through (NoSQL injection)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const { accessToken } = await registerStore();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ana@tienda.co');
    expect(res.body.organization.name).toBe('Tienda Ana');
  });

  it('requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('locks out a user deactivated after the token was issued', async () => {
    const { accessToken } = await registerStore();
    await User.updateOne({ email: 'ana@tienda.co' }, { active: false });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(401);
  });
});
