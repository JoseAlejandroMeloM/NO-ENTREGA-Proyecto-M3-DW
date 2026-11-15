import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach } from 'vitest';

// Runs before each test file is imported, so the app reads these values when it loads.
// Single-node replica set: sales use MongoDB transactions, which need one (Atlas is a replica set too).
const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.MONGODB_URI = mongo.getUri();
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
