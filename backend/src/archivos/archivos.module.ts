import { Module } from '@nestjs/common';
import { ArchivosService } from './archivos.service.js';

@Module({
  providers: [ArchivosService],
  exports: [ArchivosService],
})
export class ArchivosModule {}
