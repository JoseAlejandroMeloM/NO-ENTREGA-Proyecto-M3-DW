import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDb } from './db/connect';

connectDb().catch((err: Error) => console.error('MongoDB connection failed:', err.message));

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT} (docs at /api/docs)`);
});
