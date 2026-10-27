import {
  dateAFecha,
  fechaADate,
  fechaHoraArgentina,
  hoyEnArgentina,
  leerFecha,
  leerFechaHora,
} from './fechas';

describe('fechas', () => {
  it('a las 23:30 de Argentina sigue siendo el mismo día aunque en UTC ya sea el siguiente', () => {
    // 2026-10-27 02:30 UTC = 2026-10-26 23:30 en Argentina (UTC-3).
    expect(hoyEnArgentina(new Date('2026-10-27T02:30:00Z'))).toBe('2026-10-26');
  });

  it('ida y vuelta entre texto y Date sin correrse de día', () => {
    expect(dateAFecha(fechaADate('2026-12-31'))).toBe('2026-12-31');
  });

  it('lee AAAA-MM-DD y DD/MM/AAAA y rechaza fechas que no existen', () => {
    expect(leerFecha('2026-11-05')).toBe('2026-11-05');
    expect(leerFecha('5/11/2026')).toBe('2026-11-05');
    expect(leerFecha('31/02/2026')).toBeNull();
    expect(leerFecha('2026-13-01')).toBeNull();
    expect(leerFecha('mañana')).toBeNull();
  });

  it('lee fecha y hora en hora de Argentina', () => {
    expect(leerFechaHora('2026-10-26 21:30')?.toISOString()).toBe('2026-10-27T00:30:00.000Z');
    expect(leerFechaHora('26/10/2026')?.toISOString()).toBe('2026-10-26T03:00:00.000Z');
    expect(leerFechaHora('2026-10-26 25:00')).toBeNull();
  });

  it('formatea en hora de Argentina, ida y vuelta', () => {
    const fecha = new Date('2026-10-27T00:30:00.000Z');
    expect(fechaHoraArgentina(fecha)).toBe('2026-10-26 21:30');
    expect(leerFechaHora(fechaHoraArgentina(fecha))).toEqual(fecha);
  });
});
