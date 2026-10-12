import { request } from './client'

export function listarConsumos(ordenProduccionId) {
  return request('/consumos', { query: { orden_produccion_id: ordenProduccionId } })
}

export function registrarConsumo(datos) {
  return request('/consumos', { method: 'POST', body: datos })
}
