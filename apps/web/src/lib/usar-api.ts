'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, mensajeDeError } from './api';

interface Estado<T> {
  datos: T | null;
  error: string | null;
  cargando: boolean;
  recargar: () => void;
}

/**
 * GET a la API con estado de carga y error. Con ruta null no consulta nada.
 * Mientras recarga conserva los datos anteriores, para que la pantalla no parpadee.
 */
export function useApi<T>(ruta: string | null): Estado<T> {
  const [version, setVersion] = useState(0);
  const clave = ruta === null ? null : `${version}:${ruta}`;
  const [respuesta, setRespuesta] = useState<{
    clave: string | null;
    datos: T | null;
    error: string | null;
  }>({ clave: null, datos: null, error: null });

  useEffect(() => {
    if (ruta === null || clave === null) return;
    let vigente = true;
    api<T>(ruta)
      .then((datos) => vigente && setRespuesta({ clave, datos, error: null }))
      .catch(
        (e: unknown) =>
          vigente && setRespuesta((anterior) => ({ ...anterior, clave, error: mensajeDeError(e) })),
      );
    return () => {
      vigente = false;
    };
  }, [ruta, clave]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return {
    datos: respuesta.datos,
    error: respuesta.error,
    // Está cargando mientras la última respuesta no sea la del pedido actual.
    cargando: clave !== null && respuesta.clave !== clave,
    recargar,
  };
}
