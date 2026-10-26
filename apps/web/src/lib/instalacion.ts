'use client';

import { useSyncExternalStore } from 'react';

/** Evento de Chrome que permite abrir el instalador desde un botón propio. No es estándar. */
interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Lo guarda el script del layout si Chrome lo dispara antes de que cargue React. */
    __eventoInstalar?: EventoInstalar;
  }
}

let suscriptores: (() => void)[] = [];
const avisar = () => suscriptores.forEach((s) => s());

function suscribir(alCambiar: () => void) {
  suscriptores.push(alCambiar);
  const alDisponible = (e: Event) => {
    e.preventDefault();
    window.__eventoInstalar = e as EventoInstalar;
    avisar();
  };
  const alInstalar = () => {
    window.__eventoInstalar = undefined;
    avisar();
  };
  window.addEventListener('beforeinstallprompt', alDisponible);
  window.addEventListener('appinstalled', alInstalar);
  return () => {
    suscriptores = suscriptores.filter((s) => s !== alCambiar);
    window.removeEventListener('beforeinstallprompt', alDisponible);
    window.removeEventListener('appinstalled', alInstalar);
  };
}

export type EstadoInstalacion = 'instalada' | 'disponible' | 'manual';

function estadoActual(): EstadoInstalacion {
  if (window.matchMedia('(display-mode: standalone)').matches) return 'instalada';
  return window.__eventoInstalar ? 'disponible' : 'manual';
}

/** 'instalada' si se abrió como app; 'disponible' si Chrome ofrece instalar; si no, 'manual'. */
export function useInstalacion(): EstadoInstalacion {
  return useSyncExternalStore(suscribir, estadoActual, () => 'manual');
}

/** Abre el instalador de Chrome. Devuelve true si el usuario aceptó. */
export async function instalar(): Promise<boolean> {
  const evento = window.__eventoInstalar;
  if (!evento) return false;
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  // Chrome permite usar el evento una sola vez.
  window.__eventoInstalar = undefined;
  avisar();
  return outcome === 'accepted';
}
