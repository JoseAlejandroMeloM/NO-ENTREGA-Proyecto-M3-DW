import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { auth, createEmployee, registerStore } from './helpers';

// add-sales-export: owner downloads the filtered history as CSV, one row per item.
async function setup() {
  const owner = await registerStore();
  const cashier = await createEmployee(owner.accessToken, 'store_cashier', 'caja@tienda.co');
  const product = async (name: string, sku: string) =>
    (
      await request(app)
        .post('/api/products')
        .set(auth(owner.accessToken))
        .send({ name, sku, category: 'dairy', unit: 'unit', price: 3000, stock: 50, minStock: 0 })
    ).body as { id: string };
  const milk = await product('Leche 1 L', 'LEC');
  const formula = await product('=HYPERLINK("x")', 'FORM');
  const sell = (items: { product: string; quantity: number }[], paymentMethod: string) =>
    request(app).post('/api/sales').set(auth(cashier.token)).send({ items, paymentMethod, ...(paymentMethod === 'cash' ? { amountReceived: 20000 } : {}) });
  await sell([{ product: milk.id, quantity: 2 }, { product: formula.id, quantity: 1 }], 'cash');
  await sell([{ product: milk.id, quantity: 1 }], 'card');
  return { owner, cashier };
}
const exportCsv = (token: string, query = '') =>
  request(app).get(`/api/sales/export${query}`).set(auth(token)).buffer(true);
const lines = (text: string) => text.replace(/^\ufeff/, '').trim().split('\r\n');

describe('GET /api/sales/export', () => {
  it('returns a CSV with a header and one row per item, filtered by method', async () => {
    const { owner } = await setup();
    const all = await exportCsv(owner.accessToken);
    expect(all.status).toBe(200);
    expect(all.headers['content-type']).toMatch(/text\/csv/);
    expect(all.headers['content-disposition']).toMatch(/attachment; filename="sales-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv"/);
    const rows = lines(all.text);
    expect(rows[0]).toBe('date,sale_id,cashier,payment_method,product,sku,quantity,unit_price,subtotal,sale_total,voided');
    expect(rows).toHaveLength(4);

    const cash = lines((await exportCsv(owner.accessToken, '?paymentMethod=cash')).text);
    expect(cash).toHaveLength(3);
    expect(cash.slice(1).every((r) => r.includes(',cash,'))).toBe(true);
    expect(cash.join('\n')).toContain(`"'=HYPERLINK(""x"")"`);
    expect(cash[1]).toMatch(/,9000,no$/);
  });

  it('rejects ranges longer than 92 days and reversed ranges', async () => {
    const { owner } = await setup();
    const long = await exportCsv(owner.accessToken, '?from=2026-01-01&to=2026-06-01');
    expect(long.status).toBe(400);
    expect(long.body.error.details[0].path).toBe('from');
    expect((await exportCsv(owner.accessToken, '?from=2026-01-01&to=2026-04-02')).status).toBe(200); // exactly 92 days
    expect((await exportCsv(owner.accessToken, '?from=2026-03-02&to=2026-03-01')).status).toBe(400);
  });

  it('is owner-only', async () => {
    const { cashier } = await setup();
    expect((await exportCsv(cashier.token)).status).toBe(403);
  });
});
