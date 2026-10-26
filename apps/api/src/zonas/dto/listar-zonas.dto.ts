import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListarZonasDto {
  /** Incluir zonas dadas de baja (solo admin). */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  incluirInactivas?: boolean;
}
