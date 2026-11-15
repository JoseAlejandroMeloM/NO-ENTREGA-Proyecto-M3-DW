import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { notify } from '../src/modules/notifications/service';
import { auth, createEmployee, registerDistributor, registerStore } from './helpers';

const lowStock = { type: 'low_stock' as const, title: 'Low stock: Arroz', body: '3 left', link: '/app/products' };

describe('notify()', () => {
  it('reaches every active user with the target roles in that store and nobody else', async () => {
    const owner = await registerStore();
    const inventory = await createEmployee(owner.accessToken, 'store_inventory', 'inv@tienda.co');
    const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'caja@tienda.co');
    const inactive = await createEmployee(owner.accessToken, 'store_inventory', 'old@tienda.co');
    await request(app).patch(`/api/users/${inactive.id}`).set(auth(owner.accessToken)).send({ active: false });
    const other = await registerStore({ email: 'otra@tienda.co' });

    const created = await notify({ orgId: owner.user.orgId, roles: ['store_owner', 'store_inventory'] }, lowStock);
    expect(created).toBe(2);

    const count = async (token: string) =>
      (await request(app).get('/api/notifications').set(auth(token))).body.unreadCount as number;
    expect(await count(owner.accessToken)).toBe(1);
    expect(await count(inventory.token)).toBe(1);
    expect(await count(cashier.token)).toBe(0);
    expect(await count(other.accessToken)).toBe(0);
  });

  it('targets explicit users', async () => {
    const dist = await registerDistributor();
    expect(await notify({ userIds: [dist.user.id] }, { type: 'order_created', title: 'New order' })).toBe(1);
  });
});

describe('GET /api/notifications', () => {
  it('returns only my notifications, newest first, paginated, with unreadCount', async () => {
    const owner = await registerStore();
    const other = await registerStore({ email: 'otra@tienda.co' });
    for (const n of [1, 2, 3]) await notify({ userIds: [owner.user.id] }, { ...lowStock, title: `N${n}` });
    await notify({ userIds: [other.user.id] }, lowStock);

    const res = await request(app).get('/api/notifications?limit=2').set(auth(owner.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 2, total: 3, unreadCount: 3 });
    expect(res.body.data.map((n: { title: string }) => n.title)).toEqual(['N3', 'N2']);
    expect(res.body.data[0]).toMatchObject({ type: 'low_stock', read: false, link: '/app/products' });

    const page2 = await request(app).get('/api/notifications?limit=2&page=2').set(auth(owner.accessToken));
    expect(page2.body.data.map((n: { title: string }) => n.title)).toEqual(['N1']);
  });

  it('filters unread and validates the query', async () => {
    const owner = await registerStore();
    await notify({ userIds: [owner.user.id] }, lowStock);
    const unread = await request(app).get('/api/notifications?unread=false').set(auth(owner.accessToken));
    expect(unread.body.total).toBe(0);
    const bad = await request(app).get('/api/notifications?limit=500').set(auth(owner.accessToken));
    expect(bad.status).toBe(400);
  });

  it('requires a token', async () => {
    expect((await request(app).get('/api/notifications')).status).toBe(401);
  });
});

describe('marking as read', () => {
  it('marks one of mine as read and 404s on someone else’s', async () => {
    const owner = await registerStore();
    const other = await registerStore({ email: 'otra@tienda.co' });
    await notify({ userIds: [owner.user.id] }, lowStock);
    const [mine] = (await request(app).get('/api/notifications').set(auth(owner.accessToken))).body.data;

    const stolen = await request(app).patch(`/api/notifications/${mine.id}/read`).set(auth(other.accessToken));
    expect(stolen.status).toBe(404);

    const ok = await request(app).patch(`/api/notifications/${mine.id}/read`).set(auth(owner.accessToken));
    expect(ok.status).toBe(204);
    const after = await request(app).get('/api/notifications').set(auth(owner.accessToken));
    expect(after.body.unreadCount).toBe(0);
    expect(after.body.data[0].read).toBe(true);
  });

  it('rejects malformed ids', async () => {
    const owner = await registerStore();
    const res = await request(app).patch('/api/notifications/not-an-id/read').set(auth(owner.accessToken));
    expect(res.status).toBe(400);
  });

  it('read-all sets my unread count to 0 without touching other users', async () => {
    const owner = await registerStore();
    const other = await registerStore({ email: 'otra@tienda.co' });
    for (let i = 0; i < 3; i++) await notify({ userIds: [owner.user.id] }, lowStock);
    await notify({ userIds: [other.user.id] }, lowStock);

    const res = await request(app).post('/api/notifications/read-all').set(auth(owner.accessToken));
    expect(res.status).toBe(204);
    expect((await request(app).get('/api/notifications').set(auth(owner.accessToken))).body.unreadCount).toBe(0);
    expect((await request(app).get('/api/notifications').set(auth(other.accessToken))).body.unreadCount).toBe(1);
  });
});
