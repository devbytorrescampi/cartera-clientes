import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

/**
 * Campo opcional que, si viene, no puede ser null (por ejemplo rubro o estado en un PATCH).
 * IsOptional deja pasar null; esto solo deja pasar la ausencia del campo.
 */
export const OpcionalNoNulo = () => ValidateIf((_objeto, valor) => valor !== undefined);

/** Recorta espacios y convierte el texto vacío en null. */
export const RecortarTexto = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const recortado = value.trim();
    return recortado === '' ? null : recortado;
  });

/** Texto libre opcional: recortado, vacío = null, con largo máximo. */
export const TextoOpcional = (largoMaximo: number) =>
  applyDecorators(RecortarTexto(), IsOptional(), IsString(), MaxLength(largoMaximo));
