'use client';

import { ETIQUETAS } from '@tcshop/shared';
import type { DatosComercio } from '@/lib/formulario-comercio';
import type { Zona } from '@/lib/tipos';
import { UbicacionGps, type Ubicacion } from './ubicacion-gps';
import { AreaTexto, Campo, Chips } from './ui';
import { etiquetaZona } from '@/lib/formato';

/**
 * Campos del comercio, ordenados para cargar rápido: lo imprescindible arriba.
 * Lo usan la pantalla Cargar y la ficha. Las zonas solo se muestran si se pasan (en la ficha).
 */
export function FormularioComercio({
  datos,
  onCambio,
  onUbicacion,
  zonas,
}: {
  datos: DatosComercio;
  onCambio: (cambio: Partial<DatosComercio>) => void;
  onUbicacion?: (ubicacion: Ubicacion | null) => void;
  zonas?: Zona[];
}) {
  const mostrarSistema =
    datos.facturacion === 'OTRO_SISTEMA' || datos.stock === 'SISTEMA' || datos.sistemaActual !== '';

  return (
    <div className="flex flex-col gap-5">
      <Campo
        etiqueta="Nombre del comercio"
        value={datos.nombre}
        onChange={(e) => onCambio({ nombre: e.target.value })}
        autoCapitalize="words"
        maxLength={150}
      />
      <Campo
        etiqueta="Dirección"
        placeholder="Calle y altura, o esquina"
        value={datos.direccion}
        onChange={(e) => onCambio({ direccion: e.target.value })}
        maxLength={200}
        ayuda="Con el nombre o la dirección alcanza para guardar."
      />

      <UbicacionGps
        lat={datos.lat}
        lng={datos.lng}
        onCambio={(ubicacion) => {
          onCambio({ lat: ubicacion?.lat ?? null, lng: ubicacion?.lng ?? null });
          onUbicacion?.(ubicacion);
        }}
      />

      {zonas && zonas.length > 0 && (
        <Chips
          etiqueta="Zona o ruta"
          obligatorio
          opciones={Object.fromEntries(zonas.map((z) => [String(z.id), etiquetaZona(z)]))}
          valor={datos.zonaId === null ? null : String(datos.zonaId)}
          onCambio={(id) => id && onCambio({ zonaId: Number(id) })}
        />
      )}

      <Chips
        etiqueta="Rubro"
        opciones={ETIQUETAS.rubro}
        valor={datos.rubro}
        onCambio={(rubro) => onCambio({ rubro })}
      />
      <Chips
        etiqueta="Interés"
        opciones={ETIQUETAS.interes}
        valor={datos.interes}
        onCambio={(interes) => onCambio({ interes })}
      />
      <Chips
        etiqueta="Atendió"
        opciones={ETIQUETAS.atendio}
        valor={datos.atendio}
        onCambio={(atendio) => onCambio({ atendio })}
      />
      <Campo
        etiqueta="Quién decide"
        value={datos.contactoNombre}
        onChange={(e) => onCambio({ contactoNombre: e.target.value })}
        autoCapitalize="words"
        maxLength={120}
      />

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 font-semibold">Celular (WhatsApp)</legend>
        <div className="flex gap-2">
          <Campo
            etiqueta="Cód. área"
            className="w-28 shrink-0"
            inputMode="numeric"
            value={datos.telefonoCodArea}
            onChange={(e) => onCambio({ telefonoCodArea: e.target.value })}
            maxLength={6}
          />
          <Campo
            etiqueta="Número"
            className="flex-1"
            inputMode="tel"
            placeholder="15 512 3456"
            value={datos.telefonoNumero}
            onChange={(e) => onCambio({ telefonoNumero: e.target.value })}
            maxLength={20}
          />
        </div>
        <span className="text-sm text-texto-suave">Con o sin 0 y 15, se corrigen solos.</span>
      </fieldset>

      <Chips
        etiqueta="¿Cómo factura?"
        opciones={ETIQUETAS.facturacion}
        valor={datos.facturacion}
        onCambio={(facturacion) => onCambio({ facturacion })}
      />
      <Chips
        etiqueta="¿Cómo controla el stock?"
        opciones={ETIQUETAS.stock}
        valor={datos.stock}
        onCambio={(stock) => onCambio({ stock })}
      />
      {mostrarSistema && (
        <Campo
          etiqueta="¿Qué sistema usa?"
          value={datos.sistemaActual}
          onChange={(e) => onCambio({ sistemaActual: e.target.value })}
          maxLength={120}
        />
      )}

      <Chips
        etiqueta="Estado"
        obligatorio
        opciones={ETIQUETAS.estado}
        valor={datos.estado}
        onCambio={(estado) => estado && onCambio({ estado })}
      />
      <Campo
        etiqueta="Volver el"
        type="date"
        value={datos.volverEl}
        onChange={(e) => onCambio({ volverEl: e.target.value })}
      />
      <AreaTexto
        etiqueta="Notas"
        value={datos.notas}
        onChange={(e) => onCambio({ notas: e.target.value })}
        maxLength={5000}
      />
    </div>
  );
}
