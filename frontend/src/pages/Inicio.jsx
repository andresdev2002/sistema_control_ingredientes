import { useAuth } from '../context/useAuth'
import PageHeader from '../components/PageHeader'

export default function Inicio() {
  const { usuario, rol } = useAuth()
  return (
    <>
      <PageHeader titulo={`Bienvenido, ${usuario.nombre}`} descripcion={`Rol: ${rol}. Usa el menú lateral para navegar.`} />
    </>
  )
}
