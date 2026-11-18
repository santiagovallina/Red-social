export type Agrupacion = 'hora' | 'dia' | 'mes';

export interface PublicacionesDeUsuario {
  usuarioId: string;
  usuario: string;
  nombre: string;
  cantidad: number;
}

export interface PuntoDeComentarios {
  fecha: string;
  cantidad: number;
}

export interface ComentariosEnElTiempo {
  total: number;
  agrupar: Agrupacion;
  serie: PuntoDeComentarios[];
}

export interface ComentariosDePublicacion {
  publicacionId: string;
  titulo: string;
  cantidad: number;
}
