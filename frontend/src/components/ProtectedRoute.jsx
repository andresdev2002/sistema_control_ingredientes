import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import SinAcceso from '../pages/SinAcceso'
import LoadingBlock from './LoadingBlock'

export default function ProtectedRoute({ roles, children }) {
  const { usuario, rol, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return <LoadingBlock />
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (roles && !roles.includes(rol)) return <SinAcceso />
  return children
}
