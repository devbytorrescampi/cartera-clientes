import { dateAFecha, fechaADate, hoyEnArgentina } from './fechas';

describe('fechas', () => {
  it('a las 23:30 de Argentina sigue siendo el mismo día aunque en UTC ya sea el siguiente', () => {
    // 2026-10-27 02:30 UTC = 2026-10-26 23:30 en Argentina (UTC-3).
    expect(hoyEnArgentina(new Date('2026-10-27T02:30:00Z'))).toBe('2026-10-26');
  });

  it('ida y vuelta entre texto y Date sin correrse de día', () => {
    expect(dateAFecha(fechaADate('2026-12-31'))).toBe('2026-12-31');
  });
});
