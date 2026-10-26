'use client';

import { ETIQUETAS, type TipoVisita } from '@tcshop/shared';
import { AreaTexto, Campo, Chips } from './ui';

export interface DatosVisita {
  tipo: TipoVisita;
  resultado: string;
  notas: string;
}

export const visitaVacia = (tipo: TipoVisita = 'SEGUIMIENTO'): DatosVisita => ({
  tipo,
  resultado: '',
  notas: '',
});

export const cuerpoVisita = (v: DatosVisita) => ({
  tipo: v.tipo,
  resultado: v.resultado.trim() || null,
  notas: v.notas.trim() || null,
});

export function CamposVisita({
  datos,
  onCambio,
}: {
  datos: DatosVisita;
  onCambio: (cambio: Partial<DatosVisita>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Chips
        etiqueta="Tipo de visita"
        obligatorio
        opciones={ETIQUETAS.tipoVisita}
        valor={datos.tipo}
        onCambio={(tipo) => tipo && onCambio({ tipo })}
      />
      <Campo
        etiqueta="Resultado"
        placeholder="Ej.: quedamos en hacer la demo el jueves"
        value={datos.resultado}
        onChange={(e) => onCambio({ resultado: e.target.value })}
        maxLength={500}
      />
      <AreaTexto
        etiqueta="Notas de la visita"
        value={datos.notas}
        onChange={(e) => onCambio({ notas: e.target.value })}
        maxLength={2000}
      />
    </div>
  );
}
