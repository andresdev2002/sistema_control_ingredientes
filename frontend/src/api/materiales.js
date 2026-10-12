import { request } from './client'

export function listarMateriales() {
  return request('/material-maestro')
}

export function crearMaterial(datos) {
  return request('/material-maestro', { method: 'POST', body: datos })
}

export function actualizarMaterial(codigoSap, datos) {
  return request(`/material-maestro/${encodeURIComponent(codigoSap)}`, { method: 'PATCH', body: datos })
}
