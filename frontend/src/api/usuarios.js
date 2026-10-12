import { request } from './client'

export function obtenerUsuarioActual() {
  return request('/usuarios/me')
}

export function listarUsuarios() {
  return request('/usuarios')
}

export function crearUsuario(datos) {
  return request('/usuarios', { method: 'POST', body: datos })
}

export function cambiarEstadoUsuario(id, activo) {
  return request(`/usuarios/${encodeURIComponent(id)}`, { method: 'PATCH', body: { activo } })
}
