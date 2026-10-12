const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'ingredientes_token'

export const MENSAJE_403 = 'No tienes permiso para esta acción'

let manejarSesionExpirada = null

export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
  }
}

export function obtenerToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function guardarToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage no disponible
  }
}

export function borrarToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage no disponible
  }
}

export function alExpirarSesion(fn) {
  manejarSesionExpirada = fn
}

function mensajeDeError(status, cuerpo) {
  if (status === 403) return MENSAJE_403
  const detail = cuerpo?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((e) => {
        const campo = (e.loc || []).filter((p) => p !== 'body').join('.')
        return campo ? `${campo}: ${e.msg}` : e.msg
      })
      .join('; ')
  }
  return `Error inesperado del servidor (${status})`
}

async function leerCuerpo(respuesta) {
  const texto = await respuesta.text()
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

export async function request(ruta, { method = 'GET', body, query, auth = true } = {}) {
  let url = `${API_URL}${ruta}`
  if (query) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') params.append(clave, valor)
    })
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? obtenerToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }

  const cuerpo = await leerCuerpo(respuesta)

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      borrarToken()
      if (manejarSesionExpirada) manejarSesionExpirada()
      throw new ApiError('Sesión expirada', 401)
    }
    throw new ApiError(mensajeDeError(respuesta.status, cuerpo), respuesta.status)
  }

  return cuerpo
}
