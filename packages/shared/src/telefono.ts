// Teléfonos argentinos: el código de área y el número se cargan por separado.
// Formato internacional para WhatsApp: 54 9 + código de área (sin 0) + número (sin 15).

const soloDigitos = (valor: string): string => valor.replace(/\D/g, '');

/** Quita el 0 inicial del código de área. Devuelve null si no queda un código válido (2 a 4 dígitos). */
export function normalizarCodArea(codArea: string): string | null {
  const digitos = soloDigitos(codArea).replace(/^0+/, '');
  return /^\d{2,4}$/.test(digitos) ? digitos : null;
}

/** Quita el 15 inicial del número local. Devuelve null si no queda un número válido (6 a 8 dígitos). */
export function normalizarNumeroLocal(numero: string, codArea: string): string | null {
  let digitos = soloDigitos(numero);
  const largoEsperado = 10 - codArea.length;
  if (digitos.length === largoEsperado + 2 && digitos.startsWith('15')) {
    digitos = digitos.slice(2);
  }
  return digitos.length === largoEsperado ? digitos : null;
}

/** Devuelve el número en formato 549XXXXXXXXXX, o null si los datos no forman un celular válido. */
export function telefonoWhatsApp(codArea: string, numero: string): string | null {
  const area = normalizarCodArea(codArea);
  if (!area) return null;
  const local = normalizarNumeroLocal(numero, area);
  if (!local) return null;
  return `549${area}${local}`;
}

export function linkWhatsApp(codArea: string, numero: string): string | null {
  const telefono = telefonoWhatsApp(codArea, numero);
  return telefono ? `https://wa.me/${telefono}` : null;
}
