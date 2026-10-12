import { request } from './client'

export function listarRecepciones() {
  return request('/recepciones')
}

export function crearRecepcion(datos) {
  return request('/recepciones', { method: 'POST', body: datos })
}
