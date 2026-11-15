import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { parse } from 'yaml';

// Swagger UI assets come from cdnjs (pinned version), so the serverless bundle stays small.
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14';

function findSpec(): string {
  const candidates = [
    path.resolve(__dirname, '../../../docs/spec/openapi.yaml'), // server/src/docs or server/dist/docs
    path.resolve(process.cwd(), 'docs/spec/openapi.yaml'), // Vercel function root
    path.resolve(process.cwd(), '../docs/spec/openapi.yaml'), // npm -w server
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('openapi.yaml not found');
  return found;
}

const spec: unknown = parse(readFileSync(findSpec(), 'utf8'));

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Conecta Negocio API</title>
  <link rel="stylesheet" href="${CDN}/swagger-ui.min.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${CDN}/swagger-ui-bundle.min.js"></script>
  <script src="/api/docs/init.js"></script>
</body>
</html>`;

// Kept as a separate file because helmet's CSP blocks inline scripts.
const init = `window.ui = SwaggerUIBundle({ url: '/api/docs/openapi.json', dom_id: '#swagger-ui', persistAuthorization: true });`;

export const docsRouter = Router();
docsRouter.get('/openapi.json', (_req, res) => {
  res.json(spec);
});
docsRouter.get('/init.js', (_req, res) => {
  res.type('application/javascript').send(init);
});
docsRouter.get('/', (_req, res) => {
  res.type('html').send(page);
});
