'use client';

import Link from 'next/link';
import { ETIQUETAS, type Rol } from '@tcshop/shared';
import { useState, type FormEvent } from 'react';
import { useAvisos } from '@/components/avisos';
import { Hoja } from '@/components/hoja';
import { useUsuario } from '@/components/sesion';
import { Boton, Campo, Cargando, Chips, MensajeError, unir } from '@/components/ui';
import { enviar, mensajeDeError } from '@/lib/api';
import type { UsuarioAdmin } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';

const MIN_PASSWORD = 12;

/** Lo que está abierto en la hoja: alta, edición o contraseña nueva de un usuario. */
type Edicion =
  | { tipo: 'alta' }
  | { tipo: 'editar'; usuario: UsuarioAdmin }
  | { tipo: 'password'; usuario: UsuarioAdmin };

export default function PaginaAdminUsuarios() {
  const yo = useUsuario();
  const usuarios = useApi<UsuarioAdmin[]>('/usuarios');
  const [edicion, setEdicion] = useState<Edicion | null>(null);

  const cerrar = () => setEdicion(null);
  const alGuardar = () => {
    cerrar();
    usuarios.recargar();
  };

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-texto-suave">
            Cada vendedor ve y edita solo los comercios que cargó. El admin ve todos.
          </p>
        </div>
        <Boton className="min-h-10" onClick={() => setEdicion({ tipo: 'alta' })}>
          Nuevo usuario
        </Boton>
      </div>

      <MensajeError>{usuarios.error}</MensajeError>

      <div className="overflow-x-auto rounded-xl border-2 border-superficie-2">
        <table className="w-full text-left text-sm">
          <thead className="bg-superficie">
            <tr>
              {['Nombre', 'Email', 'Rol', 'Estado', 'Comercios', 'Alta', ''].map((t) => (
                <th key={t} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.datos?.map((u) => (
              <tr
                key={u.id}
                className={unir('border-t border-superficie-2', !u.activo && 'text-texto-suave')}
              >
                <td className="px-3 py-2 font-bold">
                  {u.nombre}
                  {u.id === yo.id && <span className="ml-1 font-normal">(vos)</span>}
                </td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{ETIQUETAS.rol[u.rol]}</td>
                <td className="px-3 py-2">
                  {u.activo ? (
                    'Activo'
                  ) : (
                    <span className="font-semibold text-peligro">De baja</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/comercios?creadoPorId=${u.id}`}
                    className="text-primario hover:underline"
                  >
                    {u.comercios}
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(u.creadoEn).toLocaleDateString('es-AR')}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Boton
                      variante="secundario"
                      className="min-h-9 px-3 text-sm"
                      onClick={() => setEdicion({ tipo: 'editar', usuario: u })}
                    >
                      Editar
                    </Boton>
                    <Boton
                      variante="secundario"
                      className="min-h-9 px-3 text-sm whitespace-nowrap"
                      onClick={() => setEdicion({ tipo: 'password', usuario: u })}
                    >
                      Nueva contraseña
                    </Boton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!usuarios.datos && !usuarios.error && <Cargando />}
      </div>

      <Hoja
        abierta={edicion !== null}
        titulo={
          edicion?.tipo === 'alta'
            ? 'Nuevo usuario'
            : edicion?.tipo === 'editar'
              ? `Editar a ${edicion.usuario.nombre}`
              : `Nueva contraseña para ${edicion?.usuario.nombre ?? ''}`
        }
        onCerrar={cerrar}
      >
        {/* La key reinicia el formulario cada vez que se abre para otro usuario. */}
        {edicion?.tipo === 'alta' && <FormularioAlta key="alta" onListo={alGuardar} />}
        {edicion?.tipo === 'editar' && (
          <FormularioEdicion
            key={`editar-${edicion.usuario.id}`}
            usuario={edicion.usuario}
            esUnoMismo={edicion.usuario.id === yo.id}
            onListo={alGuardar}
          />
        )}
        {edicion?.tipo === 'password' && (
          <FormularioPassword
            key={`password-${edicion.usuario.id}`}
            usuario={edicion.usuario}
            onListo={alGuardar}
          />
        )}
      </Hoja>
    </div>
  );
}

function FormularioAlta({ onListo }: { onListo: () => void }) {
  const avisar = useAvisos();
  const [rol, setRol] = useState<Rol>('VENDEDOR');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    if (password.length < MIN_PASSWORD) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    }
    setError(null);
    setGuardando(true);
    try {
      await enviar('POST', '/usuarios', {
        nombre: datos.get('nombre'),
        email: datos.get('email'),
        rol,
        password,
      });
      avisar('Usuario creado. Pasale el email y la contraseña.');
      onListo();
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={crear} className="flex flex-col gap-4">
      <Campo etiqueta="Nombre" name="nombre" required maxLength={120} autoComplete="off" />
      <Campo etiqueta="Email" name="email" type="email" required autoComplete="off" />
      <Chips
        etiqueta="Rol"
        obligatorio
        opciones={ETIQUETAS.rol}
        valor={rol}
        onCambio={(v) => v && setRol(v)}
      />
      <CampoPassword valor={password} onCambio={setPassword} />
      <MensajeError>{error}</MensajeError>
      <Boton type="submit" disabled={guardando}>
        {guardando ? 'Creando…' : 'Crear usuario'}
      </Boton>
    </form>
  );
}

function FormularioEdicion({
  usuario,
  esUnoMismo,
  onListo,
}: {
  usuario: UsuarioAdmin;
  esUnoMismo: boolean;
  onListo: () => void;
}) {
  const avisar = useAvisos();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [rol, setRol] = useState<Rol>(usuario.rol);
  const [activo, setActivo] = useState(usuario.activo);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await enviar('PATCH', `/usuarios/${usuario.id}`, { nombre: nombre.trim(), rol, activo });
      avisar('Usuario actualizado');
      onListo();
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <p className="text-texto-suave">{usuario.email}</p>
      <Campo
        etiqueta="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        maxLength={120}
      />
      {esUnoMismo ? (
        <p className="rounded-xl bg-superficie p-3 text-sm">
          No podés cambiar tu propio rol ni darte de baja, para no quedarte afuera del panel.
        </p>
      ) : (
        <>
          <Chips
            etiqueta="Rol"
            obligatorio
            opciones={ETIQUETAS.rol}
            valor={rol}
            onCambio={(v) => v && setRol(v)}
          />
          <Chips
            etiqueta="Estado"
            obligatorio
            opciones={{ si: 'Activo', no: 'De baja' }}
            valor={activo ? 'si' : 'no'}
            onCambio={(v) => v && setActivo(v === 'si')}
          />
          {usuario.activo && !activo && (
            <p className="rounded-xl border-2 border-alerta p-3 text-sm">
              Se le cierra la sesión al instante y no puede volver a entrar. Sus comercios se
              conservan, y lo podés reactivar cuando quieras.
            </p>
          )}
        </>
      )}
      <MensajeError>{error}</MensajeError>
      <Boton type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </Boton>
    </form>
  );
}

function FormularioPassword({ usuario, onListo }: { usuario: UsuarioAdmin; onListo: () => void }) {
  const avisar = useAvisos();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (password.length < MIN_PASSWORD) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    }
    setError(null);
    setGuardando(true);
    try {
      await enviar('POST', `/usuarios/${usuario.id}/password`, { nueva: password });
      avisar('Contraseña cambiada. Se cerraron sus sesiones.');
      onListo();
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <p>
        Sirve si {usuario.nombre} se olvidó la contraseña. Se le cierran todas las sesiones y tiene
        que entrar con la nueva.
      </p>
      <CampoPassword valor={password} onCambio={setPassword} />
      <MensajeError>{error}</MensajeError>
      <Boton type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Cambiar contraseña'}
      </Boton>
    </form>
  );
}

/** Contraseña visible (el admin se la tiene que pasar al usuario), con botón para generar una. */
function CampoPassword({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  return (
    <div className="flex items-end gap-2">
      <Campo
        etiqueta="Contraseña"
        className="flex-1"
        type="text"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        autoComplete="new-password"
        spellCheck={false}
        ayuda={`Mínimo ${MIN_PASSWORD} caracteres. La puede cambiar después desde Mi cuenta.`}
      />
      <Boton variante="secundario" className="mb-6" onClick={() => onCambio(generarPassword())}>
        Generar
      </Boton>
    </div>
  );
}

/** 14 caracteres al azar, sin los que se confunden al dictarlos (0/O, 1/l/I). */
function generarPassword(): string {
  const caracteres = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const azar = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(azar, (n) => caracteres[n % caracteres.length]).join('');
}
