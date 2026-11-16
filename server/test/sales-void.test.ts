import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { StockMovement } from '../src/models/StockMovement';
import { auth, createEmployee, registerStore } from './helpers';

// add-sale-voiding: owner voids with a reason, stock comes back once, totals and insights drop the sale.
async function setup() {
  const owner = await registerStore();
  const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'caja@tienda.co');
  const product = (
    await request(app)
      .post('/api/products')
      .set(auth(owner.accessToken))
      .send({ name: 'Leche 1 L', sku: 'LEC', category: 'dairy', unit: 'unit', price: 3000, stock: 10, minStock: 0 })
  ).body as { id: string };
  const sale = (
    await request(app)
      .post('/api/sales')
      .set(auth(cashier.token))
      .send({ items: [{ product: product.id, quantity: 2 }], paymentMethod: 'card' })
  ).body as { id: string };
  return { owner, cashier, product, sale };
}

const voidSale = (token: string, id: string, body: Record<string, unknown> = { reason: 'wrong product' }) =>
  request(app).post(`/api/sales/${id}/void`).set(auth(token)).send(body);
const stockOf = async (token: string, id: string) =>
  (await request(app).get(`/api/products/${id}`).set(auth(token))).body.stock as number;

describe('POST /api/sales/:id/void', () => {
  it('voids once: marks the sale, restores stock with a void movement, then 409', async () => {
    const { owner, product, sale } = await setup();
    expect(await stockOf(owner.accessToken, product.id)).toBe(8);

    const res = await voidSale(owner.accessToken, sale.id);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: sale.id, voidReason: 'wrong product' });
    expect(res.body.voidedAt).toBeTruthy();
    expect(await stockOf(owner.accessToken, product.id)).toBe(10);
    expect(await StockMovement.countDocuments({ type: 'void', quantity: 2 })).toBe(1);

    const again = await voidSale(owner.accessToken, sale.id);
    expect(again.status).toBe(409);
    expect(await stockOf(owner.accessToken, product.id)).toBe(10);
  });

  it('is owner-only and needs a reason', async () => {
    const { owner, cashier, sale } = await setup();
    expect((await voidSale(cashier.token, sale.id)).status).toBe(403);
    const noReason = await voidSale(owner.accessToken, sale.id, { reason: ' x ' });
    expect(noReason.status).toBe(400);
    expect(noReason.body.error.details[0].path).toBe('reason');
  });

  it("returns 404 for another store's sale", async () => {
    const { sale } = await setup();
    const other = await registerStore({ email: 'otra@tienda.co', store: { name: 'Otra', address: 'Calle 2', phone: '3000000000' } });
    expect((await voidSale(other.accessToken, sale.id)).status).toBe(404);
  });

  it('keeps the sale in the history but removes it from totals and insights', async () => {
    const { owner, sale } = await setup();
    await voidSale(owner.accessToken, sale.id);

    const history = await request(app).get('/api/sales').set(auth(owner.accessToken));
    expect(history.body.data[0]).toMatchObject({ id: sale.id, voidReason: 'wrong product' });

    const summary = await request(app).get('/api/sales/summary/daily').set(auth(owner.accessToken));
    expect(summary.body).toMatchObject({ grandTotal: 0, salesCount: 0 });

    const best = await request(app).get('/api/insights/best-sellers?days=7').set(auth(owner.accessToken));
    expect(best.body.byUnits).toEqual([]);
  });
});
