import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import drugApi from './lib/drug/api';
import { readDrugs, drugs } from './lib/drug/data';
import cors from 'cors';
import { isBoom } from '@hapi/boom';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import { log } from './lib/helper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { PORT = 7860 } = process.env;

const app = express();

// Enable cross-origin resource sharing
app.use(cors());

// Middleware that parses json and looks at requests where the Content-Type header matches the type option.
app.use(express.json());

app.use(compression());

// Serve API requests from the router
app.use('/api/drug', drugApi);

// Serve app production bundle
app.use(express.static('dist/app'));

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  if (isBoom(err)) {
    return res.status(err.output.statusCode).json(err.output.payload);
  }
  next(err);
});

// Handle client routing, return all requests to the app
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'app/index.html'));
});

Promise.all([
  (async () => {
    await readDrugs();
    log(`Drug: ${drugs.length} drugs loaded`);
  })(),
]).then(() => {
  app.listen(PORT, () => {
    log(`Server listening at http://localhost:${PORT}`);
  });
});
