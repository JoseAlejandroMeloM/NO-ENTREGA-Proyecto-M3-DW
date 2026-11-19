import request from 'supertest';
import { expect, it } from 'vitest';
import app from '../src/app';
import { Sale } from '../src/models/Sale';
import { dayRange } from '../src/modules/sales/time';
import { auth, createEmployee, registerStore } from './helpers';

const date = '2026-11-01';
const input = { date, openingFloat: 100000, countedCash: 145000, note: 'Drawer recount' };
const close = (token: string, body = input) => request(app).post('/api/closings').set(auth(token)).send(body);
const history = (token: string) => request(app).get('/api/closings').set(auth(token));

it('records a shortage from net cash sales and captures card and Nequi separately', async () => {
  const { accessToken } = await registerStore();
  const product = await request(app).post('/api/products').set(auth(accessToken)).send({
    name: 'Coffee', sku: 'COFFEE', category: 'groceries', unit: 'unit', price: 50000, stock: 5, minStock: 0,
  });
  expect(product.status).toBe(201);
  for (const paymentMethod of ['cash', 'card', 'nequi']) {
    const sale = await request(app).post('/api/sales').set(auth(accessToken)).send({
      items: [{ product: product.body.id, quantity: 1 }],
      paymentMethod,
      ...(paymentMethod === 'cash' ? { amountReceived: 60000 } : {}),
    });
    expect(sale.status).toBe(201);
  }
  await Sale.collection.updateMany({}, { $set: { createdAt: dayRange(date).start } });

  const result = await close(accessToken);
  expect(result.status).toBe(201);
  expect(result.body).toMatchObject({
    ...input, expectedCash: 150000, difference: -5000, cardTotal: 50000, nequiTotal: 50000,
  });
});

it('rejects simultaneous duplicate closings for the same store and day', async () => {
  const { accessToken } = await registerStore();
  const results = await Promise.all([close(accessToken), close(accessToken)]);
  expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
  expect(results.find((result) => result.status === 409)?.body.error.code).toBe('CONFLICT');
});

it('returns the owner’s own closings newest first and allows the same date in another store', async () => {
  const first = await registerStore();
  const second = await registerStore({ email: 'other@tienda.co' });
  expect((await close(first.accessToken, { ...input, date: '2026-10-31' })).status).toBe(201);
  expect((await close(first.accessToken)).status).toBe(201);
  expect((await close(second.accessToken, { ...input, note: 'Other store' })).status).toBe(201);
  const result = await history(first.accessToken);
  expect(result.status).toBe(200);
  expect(result.body.map((row: { date: string; note: string }) => [row.date, row.note])).toEqual([
    [date, input.note], ['2026-10-31', input.note],
  ]);
});

it('rejects cashier access and invalid closing inputs', async () => {
  const { accessToken } = await registerStore();
  const { token } = await createEmployee(accessToken, 'store_cashier', 'cashier@tienda.co');
  expect((await close(token)).status).toBe(403);
  expect((await history(token)).status).toBe(403);
  expect((await close(accessToken, { ...input, date: '2026-02-30' })).status).toBe(400);
  expect((await close(accessToken, { ...input, countedCash: -1 })).status).toBe(400);
});
