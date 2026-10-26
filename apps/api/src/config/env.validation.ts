import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Entorno {
  Desarrollo = 'development',
  Produccion = 'production',
  Test = 'test',
}

export class VariablesEntorno {
  @IsEnum(Entorno)
  NODE_ENV: Entorno = Entorno.Desarrollo;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  DIRECT_URL!: string;

  /** Secreto para firmar los JWT. Generarlo con: openssl rand -base64 48 */
  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRES_IN = '7d';

  /** Orígenes permitidos para CORS, separados por coma. */
  @IsString()
  CORS_ORIGIN = 'http://localhost:3000';

  @IsOptional()
  @IsString()
  SWAGGER_ENABLED?: string;
}

export function validarEntorno(config: Record<string, unknown>): VariablesEntorno {
  // Las variables ausentes o vacías toman el valor por defecto de la clase. Sin este paso,
  // la conversión implícita transforma un PORT ausente en NaN.
  const definidas = Object.fromEntries(
    Object.entries(config).filter(([, valor]) => valor !== undefined && valor !== ''),
  );
  const variables = plainToInstance(
    VariablesEntorno,
    { ...new VariablesEntorno(), ...definidas },
    { enableImplicitConversion: true },
  );
  const errores = validateSync(variables, { skipMissingProperties: false });
  if (errores.length > 0) {
    const detalle = errores.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n');
    throw new Error(`Variables de entorno inválidas:\n${detalle}`);
  }
  return variables;
}
