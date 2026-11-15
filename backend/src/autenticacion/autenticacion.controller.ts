import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/opciones-imagen.js';
import { AutenticacionService } from './autenticacion.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { PayloadToken } from './payload-token.js';
import { UsuarioActual } from './usuario-actual.decorator.js';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('foto', opcionesImagen))
  registro(
    @Body() dto: RegistroDto,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    return this.autenticacionService.registro(dto, foto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.autenticacionService.login(dto);
  }

  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  autorizar(@UsuarioActual() usuario: PayloadToken) {
    return this.autenticacionService.autorizar(usuario);
  }

  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  refrescar(@UsuarioActual() usuario: PayloadToken) {
    return this.autenticacionService.refrescar(usuario);
  }
}
