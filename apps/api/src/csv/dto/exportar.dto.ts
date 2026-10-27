import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ExportarDto {
  /** Solo los comercios de esta zona. Sin zona, todos. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zonaId?: number;
}
