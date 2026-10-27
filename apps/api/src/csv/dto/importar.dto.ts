import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ImportarDto {
  /** Sin confirmar solo se analiza el archivo (vista previa). Con true se guardan las filas válidas. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  confirmar?: boolean;
}

export enum ResultadoFila {
  /** Se va a importar (o se importó). */
  NUEVO = 'NUEVO',
  /** Ya está cargado (mismo Id): se omite. */
  EXISTE = 'EXISTE',
  /** Tiene errores: se omite. */
  ERROR = 'ERROR',
}

export class FilaImportacionDto {
  /** Número de fila en el archivo, contando el encabezado como la 1 (igual que en Excel). */
  fila!: number;
  nombre!: string | null;
  direccion!: string | null;
  zona!: string | null;

  @ApiProperty({ enum: ResultadoFila })
  resultado!: ResultadoFila;

  errores!: string[];
  /** Avisos que no impiden importar la fila, como un posible duplicado. */
  advertencias!: string[];
}

export class ResultadoImportacionDto {
  @ApiProperty({ type: [FilaImportacionDto] })
  filas!: FilaImportacionDto[];

  nuevos!: number;
  existentes!: number;
  conErrores!: number;
  /** Cuántos se guardaron. Siempre 0 en la vista previa. */
  importados!: number;
}
