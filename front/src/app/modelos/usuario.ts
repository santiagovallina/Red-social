export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenUrl?: string;
  perfil: 'usuario' | 'administrador';
  habilitado: boolean;
}
