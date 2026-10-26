// localStorage puede no estar disponible (modo privado, almacenamiento bloqueado).
// Estas preferencias son una comodidad: si fallan, la app sigue funcionando.

export function leerLocal(clave: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

export function guardarLocal(clave: string, valor: string | null): void {
  try {
    if (valor === null) window.localStorage.removeItem(clave);
    else window.localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento: se pierde la preferencia, nada más.
  }
}

export const CLAVES = {
  zonaActual: 'tcshop:zona-actual',
  tema: 'tcshop:tema',
} as const;
