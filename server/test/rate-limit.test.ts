import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { registerStore } from './helpers';

describe('login rate limiting', () => {
  it('blocks the 6th failed attempt from the same IP with 429', async () => {
    await registerStore();
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: 'ana@tienda.co', password: 'wrong123' });
      expect(res.status).toBe(401);
    }
    const blocked = await request(app).post('/api/auth/login').send({ email: 'ana@tienda.co', password: 'secret123' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});
