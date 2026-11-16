import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { clientIp } from '../src/utils/clientIp';

// Rate limits key on clientIp: it must be the visitor's address on each platform and not fakeable.
const ipOn = (onRender: boolean, headers: Record<string, string>) => {
  const app = express();
  app.set('trust proxy', 1);
  app.get('/', (req, res) => res.send(clientIp(req, onRender)));
  return request(app).get('/').set(headers);
};

describe('clientIp', () => {
  it('Render: uses the address Cloudflare recorded, not the shared proxy addresses', async () => {
    const res = await ipOn(true, { 'CF-Connecting-IP': '203.0.113.7', 'X-Forwarded-For': '203.0.113.7, 172.70.1.1, 10.0.0.5' });
    expect(res.text).toBe('203.0.113.7');
  });

  it('Vercel: ignores CF-Connecting-IP (a visitor could fake it) and uses the trusted proxy address', async () => {
    const res = await ipOn(false, { 'CF-Connecting-IP': '6.6.6.6', 'X-Forwarded-For': '203.0.113.7' });
    expect(res.text).toBe('203.0.113.7');
  });

  it('Render without the header falls back to req.ip', async () => {
    expect((await ipOn(true, { 'X-Forwarded-For': '203.0.113.7' })).text).toBe('203.0.113.7');
  });
});
