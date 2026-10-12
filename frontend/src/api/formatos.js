import { request } from './client'

export function listarFormatos(ordenProduccionId) {
  return request('/formatos', { query: { orden_produccion_id: ordenProduccionId } })
}

export function obtenerFormato(id) {
  return request(`/formatos/${encodeURIComponent(id)}`)
}

export function generarFormato(ordenProduccionId) {
  return request('/formatos', { method: 'POST', body: { orden_produccion_id: ordenProduccionId } })
}

export function firmarLider(id) {
  return request(`/formatos/${encodeURIComponent(id)}/firmar-lider`, { method: 'POST' })
}

export function firmarCalidad(id) {
  return request(`/formatos/${encodeURIComponent(id)}/firmar-calidad`, { method: 'POST' })
}
