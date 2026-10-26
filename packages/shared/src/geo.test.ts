import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanciaMetros, puntoEnPoligono, type Punto } from './geo';

// Zona 1 del seed.
const zona1: Punto[] = [
  [-26.816, -65.2154],
  [-26.8115, -65.2382],
  [-26.8231, -65.2412],
  [-26.8282, -65.2186],
];

test('distancia: un punto consigo mismo es 0', () => {
  assert.equal(distanciaMetros([-26.82, -65.22], [-26.82, -65.22]), 0);
});

test('distancia: 0,0003° de latitud son unos 33 m', () => {
  const d = distanciaMetros([-26.82, -65.22], [-26.8203, -65.22]);
  assert.ok(d > 32 && d < 35, `distancia ${d}`);
});

test('punto en polígono: el centro de la zona 1 está adentro', () => {
  assert.equal(puntoEnPoligono([-26.82, -65.228], zona1), true);
});

test('punto en polígono: la plaza Independencia (zona 5) queda afuera de la zona 1', () => {
  assert.equal(puntoEnPoligono([-26.8305, -65.2038], zona1), false);
});
