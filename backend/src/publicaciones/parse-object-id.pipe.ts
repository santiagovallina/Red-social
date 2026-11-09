import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (!/^[a-f\d]{24}$/i.test(valor)) {
      throw new BadRequestException('El identificador no es válido');
    }
    return valor;
  }
}
