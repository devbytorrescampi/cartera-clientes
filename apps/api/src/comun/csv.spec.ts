import { escribirCsv, leerCsv, neutralizarFormula, normalizarClave, restaurarFormula } from './csv';

describe('csv', () => {
  it('escribe con BOM, ";" y CRLF, y entrecomilla lo que hace falta', () => {
    const texto = escribirCsv([
      ['Nombre', 'Notas'],
      ['Kiosco "El Sol"', 'línea 1\nlínea 2; con punto y coma'],
    ]);
    expect(texto).toBe(
      '﻿Nombre;Notas\r\n"Kiosco ""El Sol""";"línea 1\nlínea 2; con punto y coma"\r\n',
    );
  });

  it('lee lo que escribe', () => {
    const filas = [
      ['a', 'b;c', 'd"e'],
      ['', 'f\r\ng', 'h'],
    ];
    expect(leerCsv(escribirCsv(filas))).toEqual(filas);
  });

  it('detecta la coma como separador y descarta las filas vacías', () => {
    expect(leerCsv('Zona,Nombre\n1,"Uno, dos"\n\n,\n2,Tres')).toEqual([
      ['Zona', 'Nombre'],
      ['1', 'Uno, dos'],
      ['2', 'Tres'],
    ]);
  });

  it('neutraliza fórmulas al exportar y las restaura al importar', () => {
    for (const peligroso of ['=HYPERLINK("x")', '+1', '-2', '@SUMA(A1)']) {
      expect(neutralizarFormula(peligroso)).toBe(`'${peligroso}`);
      expect(restaurarFormula(neutralizarFormula(peligroso))).toBe(peligroso);
    }
    expect(neutralizarFormula('Kiosco')).toBe('Kiosco');
    expect(restaurarFormula("'Tito's")).toBe("'Tito's");
  });

  it('normaliza claves sin acentos ni signos', () => {
    expect(normalizarClave('Cód. área')).toBe('codarea');
    expect(normalizarClave('Almacén/autoservicio')).toBe('almacenautoservicio');
  });
});
