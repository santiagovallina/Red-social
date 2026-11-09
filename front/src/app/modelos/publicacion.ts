export interface AutorPublicacion {
  _id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  imagenUrl?: string;
}

export interface Publicacion {
  _id: string;
  titulo: string;
  mensaje: string;
  imagenUrl?: string;
  autor: AutorPublicacion;
  cantidadMeGusta: number;
  meGustaYo: boolean;
  createdAt: string;
}

export interface PaginaPublicaciones {
  items: Publicacion[];
  total: number;
  offset: number;
  limit: number;
}

export interface EstadoMeGusta {
  cantidadMeGusta: number;
  meGustaYo: boolean;
}

export type OrdenPublicaciones = 'fecha' | 'meGusta';
