import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

// Los e2e corren contra una base propia (.env.test) para no tocar los datos reales.
// Se asigna a mano porque process.loadEnvFile no llega al process.env aislado de jest.
const archivo = join(__dirname, '..', '.env.test');
if (!existsSync(archivo)) {
  throw new Error('Falta apps/api/.env.test (copiar .env.test.example y ajustarlo).');
}
Object.assign(process.env, parseEnv(readFileSync(archivo, 'utf8')), { NODE_ENV: 'test' });
