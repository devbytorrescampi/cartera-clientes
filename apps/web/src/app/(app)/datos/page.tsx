'use client';

import { useState, type ChangeEvent } from 'react';
import { useAvisos } from '@/components/avisos';
import { Encabezado } from '@/components/encabezado';
import { useZonas } from '@/components/zonas';
import { Boton, MensajeError, unir } from '@/components/ui';
import { api, mensajeDeError, query } from '@/lib/api';
import type { FilaImportacion, ResultadoImportacion } from '@/lib/tipos';

const TAMANIO_MAXIMO = 3 * 1024 * 1024;

/** Excel guarda en UTF-8 o, en Windows, en Latin-1 (windows-1252). Se prueba primero UTF-8. */
async function leerArchivo(archivo: File): Promise<string> {
  const bytes = await archivo.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

const importar = (contenido: string, confirmar: boolean) =>
  api<ResultadoImportacion>(`/importar/comercios${confirmar ? '?confirmar=true' : ''}`, {
    method: 'POST',
    body: contenido,
    headers: { 'Content-Type': 'text/csv' },
  });

export default function PaginaDatos() {
  const { zonas } = useZonas();
  const avisar = useAvisos();
  const [zonaId, setZonaId] = useState('');
  const [archivo, setArchivo] = useState<{ nombre: string; contenido: string } | null>(null);
  const [vista, setVista] = useState<ResultadoImportacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  // Cambiar la key vacía el input de archivo después de importar o descartar.
  const [claveInput, setClaveInput] = useState(0);

  function descartar() {
    setArchivo(null);
    setVista(null);
    setError(null);
    setClaveInput((c) => c + 1);
  }

  async function elegirArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0];
    setVista(null);
    setError(null);
    if (!elegido) return setArchivo(null);
    if (elegido.size > TAMANIO_MAXIMO) {
      setArchivo(null);
      return setError('El archivo pesa más de 3 MB. Dividilo en partes.');
    }
    setTrabajando(true);
    try {
      const contenido = await leerArchivo(elegido);
      setArchivo({ nombre: elegido.name, contenido });
      setVista(await importar(contenido, false));
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(false);
    }
  }

  async function confirmar() {
    if (!archivo) return;
    setTrabajando(true);
    setError(null);
    try {
      const resultado = await importar(archivo.contenido, true);
      avisar(
        resultado.importados === 1
          ? 'Se importó 1 comercio.'
          : `Se importaron ${resultado.importados} comercios.`,
      );
      descartar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setTrabajando(false);
    }
  }

  const conObservaciones =
    vista?.filas.filter((f) => f.errores.length > 0 || f.advertencias.length > 0) ?? [];

  return (
    <>
      <Encabezado titulo="Exportar e importar" atras="/cuenta" />
      <main className="mx-auto flex max-w-lg flex-col gap-8 p-4">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Exportar a Excel</h2>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Zona</span>
            <select
              value={zonaId}
              onChange={(e) => setZonaId(e.target.value)}
              className="min-h-12 w-full rounded-xl border-2 border-borde bg-fondo px-4 text-lg outline-none focus:border-primario"
            >
              <option value="">Todas las zonas</option>
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.id}>
                  {zona.nombre}
                </option>
              ))}
            </select>
          </label>
          <a
            href={`/api/exportar/comercios.csv${query({ zonaId })}`}
            download
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primario px-4 text-base font-bold text-primario-texto active:scale-[0.98]"
          >
            Descargar CSV
          </a>
          <p className="text-sm text-texto-suave">
            Se abre con Excel. Incluye una columna Id: si después importás el mismo archivo, los
            comercios que ya están cargados no se duplican.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Importar desde CSV</h2>
          <p className="text-sm text-texto-suave">
            Usá el formato del CSV exportado. Las columnas Zona y Rubro son obligatorias, y cada
            fila necesita nombre o dirección. Antes de guardar vas a ver una vista previa.
          </p>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Archivo</span>
            <input
              key={claveInput}
              type="file"
              accept=".csv,text/csv"
              onChange={elegirArchivo}
              disabled={trabajando}
              className="min-h-12 w-full rounded-xl border-2 border-dashed border-borde bg-fondo p-3 text-base file:mr-3 file:rounded-lg file:border-0 file:bg-superficie-2 file:px-3 file:py-2 file:font-semibold file:text-texto"
            />
          </label>
          {trabajando && !vista && <p className="text-texto-suave">Revisando el archivo…</p>}
          <MensajeError>{error}</MensajeError>

          {vista && (
            <>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <Contador valor={vista.nuevos} texto="para importar" />
                <Contador valor={vista.existentes} texto="ya cargados" />
                <Contador valor={vista.conErrores} texto="con errores" alerta />
              </dl>

              {conObservaciones.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {conObservaciones.map((fila) => (
                    <FilaObservada key={fila.fila} fila={fila} />
                  ))}
                </ul>
              )}

              {vista.conErrores > 0 && vista.nuevos > 0 && (
                <p className="text-sm text-texto-suave">
                  Las filas con errores se omiten. Podés corregirlas en el archivo y volver a
                  elegirlo.
                </p>
              )}

              <div className="flex flex-col gap-2">
                {vista.nuevos > 0 && (
                  <Boton onClick={confirmar} disabled={trabajando}>
                    {trabajando
                      ? 'Importando…'
                      : vista.nuevos === 1
                        ? 'Importar 1 comercio'
                        : `Importar ${vista.nuevos} comercios`}
                  </Boton>
                )}
                <Boton variante="secundario" onClick={descartar} disabled={trabajando}>
                  {vista.nuevos > 0 ? 'Cancelar' : 'Elegir otro archivo'}
                </Boton>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}

function Contador({ valor, texto, alerta }: { valor: number; texto: string; alerta?: boolean }) {
  return (
    <div className="rounded-xl bg-superficie p-3">
      <dd className={unir('text-2xl font-bold', alerta && valor > 0 && 'text-peligro')}>{valor}</dd>
      <dt className="text-sm text-texto-suave">{texto}</dt>
    </div>
  );
}

function FilaObservada({ fila }: { fila: FilaImportacion }) {
  const conError = fila.resultado === 'ERROR';
  return (
    <li
      className={unir(
        'rounded-xl border-2 p-3',
        conError ? 'border-peligro' : 'border-borde bg-superficie',
      )}
    >
      <p className="font-bold">
        Fila {fila.fila}
        {(fila.nombre || fila.direccion) && `: ${fila.nombre ?? fila.direccion}`}
      </p>
      {fila.zona && <p className="text-sm text-texto-suave">{fila.zona}</p>}
      <ul className="mt-1 flex flex-col gap-1 text-sm">
        {fila.errores.map((texto) => (
          <li key={texto} className="font-medium text-peligro">
            {texto}
          </li>
        ))}
        {fila.advertencias.map((texto) => (
          <li key={texto}>{conError ? texto : `Aviso: ${texto}`}</li>
        ))}
      </ul>
    </li>
  );
}
