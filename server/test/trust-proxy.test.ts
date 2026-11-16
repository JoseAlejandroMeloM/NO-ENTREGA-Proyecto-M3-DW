import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { trustProxyHops } from '../src/config/env';

// The rate limits key on req.ip, so it must be the visitor's address on each platform.
const ipWith = (hops: number, forwardedFor: string) => {
  const app = express();
  app.set('trust proxy', hops);
  app.get('/', (req, res) => res.send(req.ip));
  return request(app).get('/').set('X-Forwarded-For', forwardedFor);
};

describe('trustProxyHops', () => {
  it('is 1 by default (Vercel), 2 on Render, and can be set explicitly', () => {
    expect(trustProxyHops({ TRUST_PROXY_HOPS: undefined, RENDER: undefined })).toBe(1);
    expect(trustProxyHops({ TRUST_PROXY_HOPS: undefined, RENDER: 'true' })).toBe(2);
    expect(trustProxyHops({ TRUST_PROXY_HOPS: 3, RENDER: 'true' })).toBe(3);
  });

  it("Render (2 hops): uses the address Cloudflare recorded, not the edge's or a faked one", async () => {
    // Visitor sent a fake header; Cloudflare appended the real visitor; Render's proxy appended the Cloudflare edge.
    const chain = '6.6.6.6, 203.0.113.7, 172.70.1.1';
    expect((await ipWith(2, chain)).text).toBe('203.0.113.7');
    expect((await ipWith(1, chain)).text).toBe('172.70.1.1'); // the old setting: a shared edge address
  });

  it('Vercel (1 hop): uses the address Vercel wrote', async () => {
    expect((await ipWith(1, '203.0.113.7')).text).toBe('203.0.113.7');
  });
});
