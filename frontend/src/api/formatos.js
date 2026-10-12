import { request } from './client'

export function generarFormato(ordenProduccionId) {
  return request('/formatos', { method: 'POST', body: { orden_produccion_id: ordenProduccionId } })
}
