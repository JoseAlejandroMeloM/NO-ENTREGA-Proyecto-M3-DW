// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json).
// An Express app is a (req, res) handler, so it can be exported as the function.
import app from '../server/src/app';

export default app;
