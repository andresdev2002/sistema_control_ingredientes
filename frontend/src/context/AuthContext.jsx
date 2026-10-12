import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/auth'
import { alExpirarSesion, borrarToken, guardarToken, obtenerToken } from '../api/client'
import { obtenerUsuarioActual } from '../api/usuarios'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(() => Boolean(obtenerToken()))

  useEffect(() => {
    alExpirarSesion(() => {
      setUsuario(null)
      navigate('/login', { replace: true, state: { aviso: 'Sesión expirada' } })
    })
    return () => alExpirarSesion(null)
  }, [navigate])

  useEffect(() => {
    if (!obtenerToken()) return
    let activo = true
    obtenerUsuarioActual()
      .then((datos) => {
        if (activo) setUsuario(datos)
      })
      .catch(() => {})
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const login = useCallback(async (documento, password) => {
    const { access_token } = await loginApi(documento, password)
    guardarToken(access_token)
    try {
      const datos = await obtenerUsuarioActual()
      setUsuario(datos)
      return datos
    } catch (error) {
      borrarToken()
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    borrarToken()
    setUsuario(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const valor = useMemo(
    () => ({ usuario, rol: usuario?.rol ?? null, cargando, login, logout }),
    [usuario, cargando, login, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
