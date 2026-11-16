/**
 * `npm run seed -- --confirm` — loads the demo data into a REAL database (MongoDB Atlas),
 * so production has something to show. Reads MONGODB_URI from `server/.env` (never committed).
 *
 * It starts the API in this process on a random local port and creates everything through it,
 * exactly like `npm run demo`. Safe to run twice: it stops if the demo store already exists.
 */
import 'dotenv/config';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { DEMO_ACCOUNTS, FIRST_ACCOUNT, PASSWORD, seed } from './seed-data';

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error('This writes demo data to the database in MONGODB_URI. Run again with --confirm:  npm run seed -- --confirm');
    process.exit(1);
  }
  // Tokens issued here only live for this run, so any secret works when none is set.
  process.env.JWT_SECRET ||= crypto.randomBytes(32).toString('hex');
  const { env } = await import('../src/config/env');
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (put it in server/.env)');

  const check = await mongoose.createConnection(uri).asPromise();
  const existing = await check.collection('users').findOne({ email: FIRST_ACCOUNT });
  await check.close();
  if (existing) {
    console.log(`Already seeded (${FIRST_ACCOUNT} exists). Nothing to do.`);
    return;
  }

  const { default: app } = await import('../src/app');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  try {
    await seed(`http://127.0.0.1:${port}/api`, uri);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
  console.log(`Seeded. Password for every account: ${PASSWORD}
  Store:       ${DEMO_ACCOUNTS.store.join(' · ')}
  Distributor: ${DEMO_ACCOUNTS.distributor.join(' · ')}`);
}

// Exit explicitly: the app keeps timers (rate-limit windows) that would keep Node alive.
main().then(
  () => process.exit(0),
  (err: unknown) => {
    console.error(err);
    process.exit(1);
  },
);
