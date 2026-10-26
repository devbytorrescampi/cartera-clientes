import { Request, Response } from 'express';
import { verificarProxy } from './proxy-secreto.middleware';

const SECRETO = 'un-secreto-compartido-de-prueba-de-32+';

function ejecutar(secreto: string | undefined, path: string, headers: Record<string, string>) {
  const req = {
    path,
    header: (nombre: string) => headers[nombre.toLowerCase()],
  } as unknown as Request;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
  const next = jest.fn();
  verificarProxy(secreto)(req, res, next);
  return { req, res, next };
}

describe('verificarProxy', () => {
  it('sin secreto configurado deja pasar todo e ignora la IP informada', () => {
    const { req, next } = ejecutar(undefined, '/auth/me', { 'x-client-ip': '1.2.3.4' });
    expect(next).toHaveBeenCalled();
    expect(req.ipCliente).toBeUndefined();
  });

  it('con secreto: rechaza un request sin el header', () => {
    const { res, next } = ejecutar(SECRETO, '/auth/me', {});
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('con secreto: rechaza un secreto incorrecto', () => {
    const { next } = ejecutar(SECRETO, '/auth/me', { 'x-proxy-secret': 'otro' });
    expect(next).not.toHaveBeenCalled();
  });

  it('con secreto correcto: deja pasar y toma la IP del cliente', () => {
    const { req, next } = ejecutar(SECRETO, '/auth/me', {
      'x-proxy-secret': SECRETO,
      'x-client-ip': '190.1.2.3',
    });
    expect(next).toHaveBeenCalled();
    expect(req.ipCliente).toBe('190.1.2.3');
  });

  it('descarta una IP con formato inválido', () => {
    const { req } = ejecutar(SECRETO, '/x', { 'x-proxy-secret': SECRETO, 'x-client-ip': 'hola' });
    expect(req.ipCliente).toBeUndefined();
  });

  it('/health queda libre para el monitoreo', () => {
    const { next } = ejecutar(SECRETO, '/health', {});
    expect(next).toHaveBeenCalled();
  });
});
