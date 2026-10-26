import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

const unir = (...clases: (string | false | null | undefined)[]) => clases.filter(Boolean).join(' ');

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'peligroLleno' | 'fantasma';

const ESTILOS_BOTON: Record<VarianteBoton, string> = {
  primario: 'bg-primario text-primario-texto',
  secundario: 'border-2 border-borde bg-fondo text-texto',
  peligro: 'border-2 border-peligro text-peligro bg-fondo',
  peligroLleno: 'bg-peligro text-fondo',
  fantasma: 'text-texto',
};

/** Botón de al menos 48 px de alto, pensado para tocar con el pulgar. */
export function Boton({
  variante = 'primario',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBoton }) {
  return (
    <button
      type="button"
      className={unir(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-bold',
        'active:scale-[0.98] disabled:opacity-50',
        ESTILOS_BOTON[variante],
        className,
      )}
      {...props}
    />
  );
}

/** Grupo de chips de selección única. Tocar el elegido lo deselecciona (salvo `obligatorio`). */
export function Chips<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
  obligatorio = false,
}: {
  etiqueta: string;
  opciones: Record<T, string>;
  valor: T | null | undefined;
  onCambio: (valor: T | null) => void;
  obligatorio?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {(Object.entries(opciones) as [T, string][]).map(([clave, texto]) => {
          const elegido = valor === clave;
          return (
            <button
              key={clave}
              type="button"
              aria-pressed={elegido}
              onClick={() => onCambio(elegido && !obligatorio ? null : clave)}
              className={unir(
                'min-h-12 rounded-full border-2 px-4 text-base font-medium',
                elegido
                  ? 'border-primario bg-primario text-primario-texto'
                  : 'border-borde bg-fondo text-texto',
              )}
            >
              {texto}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const ESTILO_CAMPO =
  'min-h-12 w-full rounded-xl border-2 border-borde bg-fondo px-4 text-lg outline-none focus:border-primario';

export function Campo({
  etiqueta,
  ayuda,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; ayuda?: ReactNode }) {
  return (
    <label className={unir('flex flex-col gap-1', className)}>
      <span className="font-semibold">{etiqueta}</span>
      <input className={ESTILO_CAMPO} {...props} />
      {ayuda && <span className="text-sm text-texto-suave">{ayuda}</span>}
    </label>
  );
}

export function AreaTexto({
  etiqueta,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold">{etiqueta}</span>
      <textarea className={unir(ESTILO_CAMPO, 'min-h-28 py-3')} {...props} />
    </label>
  );
}

export function MensajeError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border-2 border-peligro p-3 font-medium text-peligro">
      {children}
    </p>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return <p className="py-8 text-center text-texto-suave">{texto}</p>;
}

export { unir };
