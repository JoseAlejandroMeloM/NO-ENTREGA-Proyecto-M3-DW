import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { auth, createEmployee, registerDistributor, registerStore } from './helpers';

const employee = (role: string, email = 'emp@tienda.co') => ({ name: 'Carla Cajera', email, password: 'secret123', role });

describe('POST /api/users', () => {
  it('lets a store owner create a cashier in their store', async () => {
    const owner = await registerStore();
    const res = await request(app).post('/api/users').set(auth(owner.accessToken)).send(employee('store_cashier'));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ role: 'store_cashier', orgType: 'store', orgId: owner.user.orgId, active: true });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('rejects roles that do not belong to the organization type', async () => {
    const owner = await registerStore();
    for (const role of ['distributor_staff', 'store_owner']) {
      const res = await request(app).post('/api/users').set(auth(owner.accessToken)).send(employee(role));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('lets a distributor owner create staff only', async () => {
    const owner = await registerDistributor();
    const ok = await request(app).post('/api/users').set(auth(owner.accessToken)).send(employee('distributor_staff'));
    const bad = await request(app)
      .post('/api/users')
      .set(auth(owner.accessToken))
      .send(employee('store_cashier', 'x@distri.co'));
    expect(ok.status).toBe(201);
    expect(bad.status).toBe(400);
  });

  it('forbids employees from creating users', async () => {
    const owner = await registerStore();
    const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'cashier@tienda.co');
    const res = await request(app).post('/api/users').set(auth(cashier.token)).send(employee('store_cashier', 'n@t.co'));
    expect(res.status).toBe(403);
  });

  it('rejects a duplicate email', async () => {
    const owner = await registerStore();
    const res = await request(app).post('/api/users').set(auth(owner.accessToken)).send(employee('store_cashier', 'ana@tienda.co'));
    expect(res.status).toBe(409);
  });
});

describe('GET /api/users', () => {
  it('lists only the members of the owner organization', async () => {
    const store = await registerStore();
    await createEmployee(store.accessToken, 'store_cashier', 'cashier@tienda.co');
    const dist = await registerDistributor();
    await createEmployee(dist.accessToken, 'distributor_staff', 'staff@distri.co');

    const res = await request(app).get('/api/users').set(auth(dist.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.map((u: { email: string }) => u.email).sort()).toEqual(['luis@distri.co', 'staff@distri.co']);
  });

  it('forbids employees', async () => {
    const owner = await registerStore();
    const inventory = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
    expect((await request(app).get('/api/users').set(auth(inventory.token))).status).toBe(403);
  });
});

describe('PATCH /api/users/:id', () => {
  it('locks out a deactivated employee immediately and allows reactivation', async () => {
    const owner = await registerStore();
    const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'cashier@tienda.co');

    const off = await request(app).patch(`/api/users/${cashier.id}`).set(auth(owner.accessToken)).send({ active: false });
    expect(off.status).toBe(200);
    expect(off.body.active).toBe(false);
    expect((await request(app).get('/api/auth/me').set(auth(cashier.token))).status).toBe(401);

    await request(app).patch(`/api/users/${cashier.id}`).set(auth(owner.accessToken)).send({ active: true });
    const login = await request(app).post('/api/auth/login').send({ email: 'cashier@tienda.co', password: 'secret123' });
    expect(login.status).toBe(200);
  });

  it('does not let an owner deactivate themselves', async () => {
    const owner = await registerStore();
    const res = await request(app).patch(`/api/users/${owner.user.id}`).set(auth(owner.accessToken)).send({ active: false });
    expect(res.status).toBe(409);
  });

  it('returns 404 for a user of another organization', async () => {
    const storeA = await registerStore();
    const storeB = await registerStore({ email: 'b@tienda.co' });
    const cashierB = await createEmployee(storeB.accessToken, 'store_cashier', 'cashier-b@tienda.co');
    const res = await request(app).patch(`/api/users/${cashierB.id}`).set(auth(storeA.accessToken)).send({ active: false });
    expect(res.status).toBe(404);
  });

  it('validates the id and the body', async () => {
    const owner = await registerStore();
    const badId = await request(app).patch('/api/users/123').set(auth(owner.accessToken)).send({ active: false });
    const badBody = await request(app).patch(`/api/users/${owner.user.id}`).set(auth(owner.accessToken)).send({ role: 'store_owner' });
    expect(badId.status).toBe(400);
    expect(badBody.status).toBe(400);
  });
});

describe('organization profile', () => {
  it('lets every store member read the store and only the owner edit it', async () => {
    const owner = await registerStore();
    const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'cashier@tienda.co');

    const read = await request(app).get('/api/stores/me').set(auth(cashier.token));
    expect(read.status).toBe(200);
    expect(read.body).toMatchObject({ id: owner.user.orgId, name: 'Tienda Ana' });

    expect((await request(app).patch('/api/stores/me').set(auth(cashier.token)).send({ name: 'Hack' })).status).toBe(403);
    const edit = await request(app).patch('/api/stores/me').set(auth(owner.accessToken)).send({ phone: '3110000000' });
    expect(edit.status).toBe(200);
    expect(edit.body.phone).toBe('3110000000');
  });

  it('lets the distributor owner change delivery days but not staff', async () => {
    const owner = await registerDistributor();
    const staff = await createEmployee(owner.accessToken, 'distributor_staff', 'staff@distri.co');

    const edit = await request(app).patch('/api/distributors/me').set(auth(owner.accessToken)).send({ deliveryDays: 2 });
    expect(edit.status).toBe(200);
    expect(edit.body.deliveryDays).toBe(2);
    expect((await request(app).get('/api/distributors/me').set(auth(staff.token))).status).toBe(200);
    expect((await request(app).patch('/api/distributors/me').set(auth(staff.token)).send({ deliveryDays: 9 })).status).toBe(403);
  });

  it('rejects empty, unknown or conflicting updates', async () => {
    await registerDistributor({ email: 'other@distri.co', distributor: { name: 'Otro', nit: '800111222', phone: '6010000000', coverageArea: 'Bogota', deliveryDays: 3, minimumOrder: 0 } });
    const owner = await registerDistributor();
    const empty = await request(app).patch('/api/distributors/me').set(auth(owner.accessToken)).send({});
    const unknown = await request(app).patch('/api/distributors/me').set(auth(owner.accessToken)).send({ ratingAverage: 5 });
    const dupNit = await request(app).patch('/api/distributors/me').set(auth(owner.accessToken)).send({ nit: '800111222' });
    expect(empty.status).toBe(400);
    expect(unknown.status).toBe(400);
    expect(dupNit.status).toBe(409);
  });

  it('keeps store users out of the distributor profile', async () => {
    const owner = await registerStore();
    expect((await request(app).get('/api/distributors/me').set(auth(owner.accessToken))).status).toBe(403);
  });
});
