import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cercaniaAZona,
  distanciaARecorridoMetros,
  distanciaMetros,
  puntoEnPoligono,
  type Punto,
} from './geo';

// Zona 1 del seed.
const zona1: Punto[] = [
  [-26.816, -65.2154],
  [-26.8115, -65.2382],
  [-26.8231, -65.2412],
  [-26.8282, -65.2186],
];

// Av. Mate de Luna de A a B, con un quiebre.
const recorrido: Punto[] = [
  [-26.82, -65.24],
  [-26.82, -65.23],
  [-26.825, -65.225],
];

test('distancia: un punto consigo mismo es 0', () => {
  assert.equal(distanciaMetros([-26.82, -65.22], [-26.82, -65.22]), 0);
});

test('distancia: 0,0003° de latitud son unos 33 m', () => {
  const d = distanciaMetros([-26.82, -65.22], [-26.8203, -65.22]);
  assert.ok(d > 32 && d < 35, `distancia ${d}`);
});

test('recorrido: un punto sobre la línea está a 0 m', () => {
  assert.ok(distanciaARecorridoMetros([-26.82, -65.235], recorrido) < 0.5);
});

test('recorrido: 0,0003° al costado de un tramo son unos 33 m', () => {
  const d = distanciaARecorridoMetros([-26.8203, -65.235], recorrido);
  assert.ok(d > 32 && d < 35, `distancia ${d}`);
});

test('recorrido: pasado el punto B se mide hasta B', () => {
  const d = distanciaARecorridoMetros([-26.83, -65.225], recorrido);
  const hastaB = distanciaMetros([-26.83, -65.225], [-26.825, -65.225]);
  assert.ok(Math.abs(d - hastaB) < 1, `${d} vs ${hastaB}`);
});

test('recorrido: con un solo tramo de dos puntos también funciona', () => {
  const d = distanciaARecorridoMetros([-26.8203, -65.235], recorrido.slice(0, 2));
  assert.ok(d > 32 && d < 35, `distancia ${d}`);
});

test('punto en polígono: el centro de la zona 1 está adentro', () => {
  assert.equal(puntoEnPoligono([-26.82, -65.228], zona1), true);
});

test('punto en polígono: la plaza Independencia (zona 5) queda afuera de la zona 1', () => {
  assert.equal(puntoEnPoligono([-26.8305, -65.2038], zona1), false);
});

test('cercanía: una ruta a menos de 50 m cuenta su distancia; más lejos, no corresponde', () => {
  const ruta = { tipo: 'RUTA' as const, puntos: recorrido };
  const d = cercaniaAZona([-26.8203, -65.235], ruta);
  assert.ok(d !== null && d > 32 && d < 35, `distancia ${d}`);
  assert.equal(cercaniaAZona([-26.83, -65.235], ruta), null);
});

test('cercanía: una zona corresponde si el punto cae adentro', () => {
  assert.equal(cercaniaAZona([-26.82, -65.228], { tipo: 'ZONA', puntos: zona1 }), Infinity);
  assert.equal(cercaniaAZona([-26.8305, -65.2038], { tipo: 'ZONA', puntos: zona1 }), null);
});
