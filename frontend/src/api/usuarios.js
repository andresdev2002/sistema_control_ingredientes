import { request } from './client'

export function obtenerUsuarioActual() {
  return request('/usuarios/me')
}
