import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/opciones-imagen.js';
import { AutenticacionService } from './autenticacion.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

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
}
