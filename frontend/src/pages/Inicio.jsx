import { Typography } from '@mui/material'
import { useAuth } from '../context/useAuth'

export default function Inicio() {
  const { usuario, rol } = useAuth()
  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Bienvenido, {usuario.nombre}
      </Typography>
      <Typography color="text.secondary">Rol: {rol}. Usa el menú lateral para navegar.</Typography>
    </>
  )
}
