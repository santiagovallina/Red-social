import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdministradorGuard } from '../autenticacion/administrador.guard.js';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard.js';
import {
  ComentariosPorTiempoDto,
  RangoFechasDto,
} from './dto/rango-fechas.dto.js';
import { EstadisticasService } from './estadisticas.service.js';

@Controller('estadisticas')
@UseGuards(JwtAuthGuard, AdministradorGuard)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() consulta: RangoFechasDto) {
    return this.estadisticasService.publicacionesPorUsuario(consulta);
  }

  @Get('comentarios')
  comentarios(@Query() consulta: ComentariosPorTiempoDto) {
    return this.estadisticasService.comentariosPorTiempo(consulta);
  }

  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() consulta: RangoFechasDto) {
    return this.estadisticasService.comentariosPorPublicacion(consulta);
  }
}
