'use client';

import type { ReactNode } from 'react';
import { ProveedorAvisos } from '@/components/avisos';
import { Navegacion } from '@/components/navegacion';
import { ProveedorSesion } from '@/components/sesion';
import { ProveedorZonas } from '@/components/zonas';

export default function LayoutApp({ children }: { children: ReactNode }) {
  return (
    <ProveedorSesion>
      <ProveedorZonas>
        <ProveedorAvisos>
          <div className="pb-navegacion">{children}</div>
          <Navegacion />
        </ProveedorAvisos>
      </ProveedorZonas>
    </ProveedorSesion>
  );
}
