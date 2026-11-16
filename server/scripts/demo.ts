/**
 * `npm run demo` — runs the whole app locally with realistic demo data and no setup:
 * an in-memory MongoDB replica set (nothing is saved), the API + client in dev mode,
 * and seed data created through the real API (so every business rule applies).
 *
 * Used for design passes and demos. Demo accounts (password `demo12345`, local only):
 *   rosa@tienda.test (store owner) · inventario@tienda.test · caja@tienda.test
 *   ventas@distrinorte.test (distributor owner) · bodega@distrinorte.test (staff)
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { PASSWORD, seed } from './seed-data';

const API = 'http://localhost:4000/api';

async function waitForApi() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${API}/health`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('API did not start');
}

async function main() {
  const db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = db.getUri('conecta-demo');
  const dev = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
    env: { ...process.env, MONGODB_URI: uri, JWT_SECRET: 'local-demo-secret-local-demo-secret-0123', NODE_ENV: 'development' },
  });
  const stop = async () => {
    dev.kill('SIGINT');
    await db.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  await waitForApi();
  await seed(API, uri);
  console.log(`
  Demo ready → http://localhost:5173  (data lives in memory; Ctrl+C stops everything)
  Password for every account: ${PASSWORD}
    Store:       rosa@tienda.test (owner) · inventario@tienda.test · caja@tienda.test
    Distributor: ventas@distrinorte.test (owner) · bodega@distrinorte.test (staff)
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
