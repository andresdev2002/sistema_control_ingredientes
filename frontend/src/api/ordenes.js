import { request } from './client'

export function listarOrdenes() {
  return request('/ordenes-produccion')
}

export function obtenerOrden(id) {
  return request(`/ordenes-produccion/${encodeURIComponent(id)}`)
}

export function crearOrden(datos) {
  return request('/ordenes-produccion', { method: 'POST', body: datos })
}

export function cerrarOrden(id) {
  return request(`/ordenes-produccion/${encodeURIComponent(id)}`, { method: 'PATCH', body: { estado: 'CERRADA' } })
}
