import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { RequestHandler } from 'express';

export const HEADER_SECRETO = 'x-proxy-secret';
export const HEADER_IP_CLIENTE = 'x-client-ip';

const resumen = (valor: string): Buffer => createHash('sha256').update(valor).digest();

/**
 * El front (Vercel) reenvía cada llamada con un secreto compartido y la IP real del cliente.
 * Con PROXY_SECRET configurado:
 * - se rechaza cualquier request que no venga del front (salvo /health, para el monitoreo);
 * - se toma la IP del cliente del header, que solo es confiable porque vino con el secreto.
 * Sin PROXY_SECRET (desarrollo local) no se exige nada y se usa la IP de la conexión.
 */
export function verificarProxy(secreto: string | undefined): RequestHandler {
  const esperado = secreto ? resumen(secreto) : null;

  return (req, res, next) => {
    if (!esperado || req.path === '/health') return next();

    const recibido = req.header(HEADER_SECRETO);
    // Se comparan resúmenes de igual largo con timingSafeEqual para no filtrar el secreto por tiempos.
    if (!recibido || !timingSafeEqual(resumen(recibido), esperado)) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden' });
      return;
    }

    const ip = req.header(HEADER_IP_CLIENTE)?.trim();
    if (ip && isIP(ip)) req.ipCliente = ip;
    next();
  };
}

declare module 'express-serve-static-core' {
  interface Request {
    /** IP real del cliente informada por el front. Solo se completa si vino con el secreto. */
    ipCliente?: string;
  }
}
