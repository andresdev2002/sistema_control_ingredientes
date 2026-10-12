import { request } from './client'

export function listarSaldos(filtros) {
  return request('/saldos', { query: filtros })
}

export function consultarSaldo(codigoBarras) {
  return request(`/saldos/${encodeURIComponent(codigoBarras)}`)
}
