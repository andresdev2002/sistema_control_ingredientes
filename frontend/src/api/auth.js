import { request } from './client'

export function login(documento, password) {
  return request('/auth/login', { method: 'POST', body: { documento, password }, auth: false })
}
