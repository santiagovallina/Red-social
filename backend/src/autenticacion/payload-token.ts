export interface PayloadToken {
  sub: string;
  usuario: string;
  perfil: string;
  iat?: number;
  exp?: number;
}
