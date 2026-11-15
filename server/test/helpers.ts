import request from 'supertest';
import app from '../src/app';

export const storeOwnerInput = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ana Gomez',
  email: 'ana@tienda.co',
  password: 'secret123',
  store: { name: 'Tienda Ana', address: 'Calle 1 # 2-3, Chia', phone: '3001234567' },
  ...overrides,
});

export const distributorOwnerInput = (overrides: Record<string, unknown> = {}) => ({
  name: 'Luis Perez',
  email: 'luis@distri.co',
  password: 'secret123',
  distributor: {
    name: 'Distri Norte',
    nit: '900123456-7',
    phone: '6017654321',
    coverageArea: 'Chia, Cajica',
    deliveryDays: 2,
    minimumOrder: 100000,
  },
  ...overrides,
});

export async function registerStore(overrides: Record<string, unknown> = {}) {
  const res = await request(app).post('/api/auth/register-store').send(storeOwnerInput(overrides));
  if (res.status !== 201) throw new Error(`register-store failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { accessToken: string; user: { id: string; orgId: string; role: string } };
}
