import { BadRequestException, ConflictException } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { tasaConversion } from '../estadisticas/estadisticas.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  alcance,
  ComerciosService,
  normalizarTelefono,
  situacionVolver,
} from './comercios.service';
import { SituacionVolver } from './dto/comercio.dto';

const admin: UsuarioSesion = { id: 'a', email: 'a@x.com', nombre: 'A', rol: Rol.ADMIN };
const vendedor: UsuarioSesion = { id: 'v', email: 'v@x.com', nombre: 'V', rol: Rol.VENDEDOR };

describe('alcance', () => {
  it('el admin ve todo lo no eliminado', () => {
    expect(alcance(admin)).toEqual({ eliminadoEn: null });
  });

  it('el vendedor ve solo lo suyo', () => {
    expect(alcance(vendedor)).toEqual({ eliminadoEn: null, creadoPorId: 'v' });
  });
});

describe('normalizarTelefono', () => {
  it('guarda el código sin 0 y el número sin 15', () => {
    expect(normalizarTelefono('0381', '15-512-3456')).toEqual({
      telefonoCodArea: '381',
      telefonoNumero: '5123456',
    });
  });

  it('sin teléfono devuelve nulls', () => {
    expect(normalizarTelefono(null, undefined)).toEqual({
      telefonoCodArea: null,
      telefonoNumero: null,
    });
  });

  it('exige los dos campos juntos', () => {
    expect(() => normalizarTelefono('381', null)).toThrow(BadRequestException);
    expect(() => normalizarTelefono(null, '5123456')).toThrow(BadRequestException);
  });

  it('rechaza un número que no cierra con el código de área', () => {
    expect(() => normalizarTelefono('381', '123')).toThrow('Teléfono inválido');
  });
});

describe('situacionVolver', () => {
  const hoy = '2026-10-26';
  it.each([
    ['2026-10-25', SituacionVolver.VENCIDO],
    ['2026-10-26', SituacionVolver.HOY],
    ['2026-10-27', SituacionVolver.PROXIMO],
    [null, SituacionVolver.SIN_FECHA],
  ])('%s → %s', (fecha, esperado) => {
    expect(situacionVolver(fecha, hoy)).toBe(esperado);
  });
});

describe('tasaConversion', () => {
  it('es 0 sin relevados', () => expect(tasaConversion(0, 0)).toBe(0));
  it('redondea a 4 decimales', () => expect(tasaConversion(1, 3)).toBe(0.3333));
});

describe('ComerciosService.crear', () => {
  const zona = { findUnique: jest.fn() };
  const comercio = { findUnique: jest.fn() };
  const $transaction = jest.fn();
  const prisma = { zona, comercio, $transaction } as unknown as PrismaService;
  const servicio = new ComerciosService(prisma);
  const base = { zonaId: 1, rubro: 'ALMACEN' as const };

  beforeEach(() => jest.resetAllMocks());

  it('exige nombre o dirección', async () => {
    await expect(servicio.crear({ ...base }, admin)).rejects.toThrow(
      'Cargá al menos el nombre o la dirección',
    );
  });

  it('exige latitud y longitud juntas', async () => {
    await expect(servicio.crear({ ...base, nombre: 'X', lat: -26.8 }, admin)).rejects.toThrow(
      'van juntas',
    );
  });

  it('rechaza una zona dada de baja', async () => {
    zona.findUnique.mockResolvedValue({ id: 1, activa: false });
    await expect(servicio.crear({ ...base, nombre: 'X' }, admin)).rejects.toThrow('dada de baja');
    expect($transaction).not.toHaveBeenCalled();
  });

  it('un alta repetida con el mismo id devuelve el existente sin crear otro', async () => {
    const id = '0b6f6d6e-8f0e-4b8e-9a51-6b0c1f1e2d3c';
    comercio.findUnique.mockResolvedValue({
      id,
      creadoPorId: vendedor.id,
      eliminadoEn: null,
      lat: null,
      lng: null,
      volverEl: null,
      telefonoCodArea: null,
      telefonoNumero: null,
    });
    const resultado = await servicio.crear({ ...base, id, nombre: 'X' }, vendedor);
    expect(resultado.id).toBe(id);
    expect($transaction).not.toHaveBeenCalled();
  });

  it('un id que ya usa otro usuario da conflicto', async () => {
    comercio.findUnique.mockResolvedValue({ id: 'x', creadoPorId: 'otro', eliminadoEn: null });
    await expect(
      servicio.crear(
        { ...base, id: '0b6f6d6e-8f0e-4b8e-9a51-6b0c1f1e2d3c', nombre: 'X' },
        vendedor,
      ),
    ).rejects.toThrow(ConflictException);
  });
});
