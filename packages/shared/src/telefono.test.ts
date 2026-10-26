import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkWhatsApp, telefonoWhatsApp } from './telefono';

test('quita el 0 del código de área y el 15 del número', () => {
  assert.equal(telefonoWhatsApp('0381', '15 512-3456'), '5493815123456');
});

test('acepta datos ya normalizados', () => {
  assert.equal(telefonoWhatsApp('381', '5123456'), '5493815123456');
});

test('respeta códigos de área de 2 y 4 dígitos', () => {
  assert.equal(telefonoWhatsApp('011', '1523456789'), '5491123456789');
  assert.equal(telefonoWhatsApp('03865', '15123456'), '5493865123456');
});

test('rechaza números con longitud incorrecta', () => {
  assert.equal(telefonoWhatsApp('381', '123'), null);
  assert.equal(telefonoWhatsApp('', '5123456'), null);
  assert.equal(linkWhatsApp('381', '51234567'), null);
});

test('arma el link wa.me', () => {
  assert.equal(linkWhatsApp('381', '155123456'), 'https://wa.me/5493815123456');
});
