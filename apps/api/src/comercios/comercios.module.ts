import { Module } from '@nestjs/common';
import { ComerciosController } from './comercios.controller';
import { ComerciosService } from './comercios.service';
import { VisitasService } from './visitas.service';

@Module({
  controllers: [ComerciosController],
  providers: [ComerciosService, VisitasService],
})
export class ComerciosModule {}
