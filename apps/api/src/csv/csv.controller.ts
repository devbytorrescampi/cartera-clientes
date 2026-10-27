import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { CsvService } from './csv.service';
import { ExportarDto } from './dto/exportar.dto';
import { ImportarDto, ResultadoImportacionDto } from './dto/importar.dto';

@ApiTags('exportar e importar')
@ApiCookieAuth()
@Controller()
export class CsvController {
  constructor(private readonly csv: CsvService) {}

  /** CSV para Excel (separador ";", UTF-8 con BOM) con los comercios que el usuario puede ver. */
  @Get('exportar/comercios.csv')
  @ApiProduces('text/csv')
  async exportar(
    @Query() filtros: ExportarDto,
    @UsuarioActual() usuario: UsuarioSesion,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<string> {
    const { nombreArchivo, contenido } = await this.csv.exportar(filtros.zonaId, usuario);
    respuesta.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Cache-Control': 'no-store',
    });
    return contenido;
  }

  /**
   * Importa un CSV con el formato del exportador. El cuerpo es el archivo, como text/csv.
   * Sin `confirmar=true` devuelve la vista previa con los errores fila por fila.
   */
  @Post('importar/comercios')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiConsumes('text/csv')
  @ApiBody({ schema: { type: 'string' } })
  @ApiOkResponse({ type: ResultadoImportacionDto })
  importar(
    @Body() contenido: unknown,
    @Query() opciones: ImportarDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<ResultadoImportacionDto> {
    if (typeof contenido !== 'string') {
      throw new BadRequestException('Mandá el archivo con Content-Type: text/csv');
    }
    return this.csv.importar(contenido, opciones.confirmar ?? false, usuario);
  }
}
