import { analizarFila } from './csv.service';
import { COLUMNAS, ubicarColumnas } from './columnas';
import { ResultadoFila } from './dto/importar.dto';

const ZONAS = [
  { id: 10, numero: 1, nombre: 'Zona 1 – Oeste cercano' },
  { id: 30, numero: 3, nombre: 'Zona 3 – Suroeste' },
];
const AHORA = new Date('2026-10-27T15:00:00Z');
const POSICIONES = ubicarColumnas(Object.values(COLUMNAS));

function fila(valores: Partial<Record<keyof typeof COLUMNAS, string>>) {
  const registro = Object.keys(COLUMNAS).map((c) => valores[c as keyof typeof COLUMNAS] ?? '');
  return analizarFila(registro, 2, POSICIONES, ZONAS, AHORA);
}

describe('analizarFila', () => {
  it('convierte una fila completa con etiquetas', () => {
    const resultado = fila({
      zona: 'Zona 3 – Suroeste',
      nombre: 'Kiosco Pepe',
      rubro: 'Kiosco/librería/regalería',
      atendio: 'Dueño',
      facturacion: 'web de arca',
      stock: 'NO_CONTROLA',
      interes: 'Alto',
      estado: 'Demo agendada',
      telefonoCodArea: '0381',
      telefonoNumero: '15 512-3456',
      volverEl: '15/11/2026',
      lat: '-26,83',
      lng: '-65.21',
      creadoEn: '2026-10-20 10:15',
      notas: "'=no es fórmula",
    });
    expect(resultado.errores).toEqual([]);
    expect(resultado.resultado).toBe(ResultadoFila.NUEVO);
    expect(resultado.datos).toMatchObject({
      zonaId: 30,
      rubro: 'KIOSCO',
      atendio: 'DUENO',
      facturacion: 'WEB_ARCA',
      stock: 'NO_CONTROLA',
      interes: 'ALTO',
      estado: 'DEMO_AGENDADA',
      telefonoCodArea: '381',
      telefonoNumero: '5123456',
      volverEl: new Date('2026-11-15T00:00:00Z'),
      lat: -26.83,
      lng: -65.21,
      creadoEn: new Date('2026-10-20T13:15:00Z'),
      notas: '=no es fórmula',
    });
  });

  it('acepta la zona por número y sin rubro carga Otro con una advertencia', () => {
    const resultado = fila({ zona: '1', direccion: 'San Martín 100' });
    expect(resultado.errores).toEqual([]);
    expect(resultado.datos).toMatchObject({ zonaId: 10, rubro: 'OTRO', creadoEn: AHORA });
    expect(resultado.advertencias).toEqual(['Sin rubro: se carga como Otro']);
  });

  it('acepta una ruta por "Ruta 3"', () => {
    const resultado = fila({ zona: 'Ruta 3', nombre: 'Kiosco' });
    expect(resultado.datos).toMatchObject({ zonaId: 30 });
  });

  it('junta todos los errores de la fila', () => {
    const resultado = fila({
      zona: 'Zona 9',
      rubro: 'Panadería',
      telefonoNumero: '5123456',
      volverEl: '31/02/2026',
      lat: '-26.8',
      creadoEn: '2027-01-01',
    });
    expect(resultado.resultado).toBe(ResultadoFila.ERROR);
    expect(resultado.datos).toBeNull();
    expect(resultado.errores).toEqual([
      'Falta el nombre o la dirección',
      'Zona: "Zona 9" no coincide con ninguna zona activa',
      expect.stringContaining('Rubro: "Panadería" no es válido'),
      'El teléfono necesita código de área y número',
      expect.stringContaining('Volver el: "31/02/2026" no es una fecha válida'),
      'Creado: la fecha es futura',
      'La latitud y la longitud van juntas',
    ]);
  });

  it('respeta un Id válido y genera uno si no hay', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
    expect(fila({ zona: '1', nombre: 'A', id: id.toUpperCase() }).datos?.id).toBe(id);
    expect(fila({ zona: '1', nombre: 'A', id: 'cualquiera' }).datos?.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
