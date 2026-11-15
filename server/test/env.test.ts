import { afterEach, describe, expect, it, vi } from 'vitest';

describe('environment validation', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it('refuses to start in production without JWT_SECRET and names only the variable', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    await expect(import('../src/config/env')).rejects.toThrow(/JWT_SECRET/);
  });

  it('rejects a short secret without printing it', async () => {
    vi.resetModules();
    process.env.JWT_SECRET = 'short-secret-value';
    const err = await import('../src/config/env').catch((e: Error) => e);
    expect(String(err)).toMatch(/JWT_SECRET/);
    expect(String(err)).not.toContain('short-secret-value');
  });
});
