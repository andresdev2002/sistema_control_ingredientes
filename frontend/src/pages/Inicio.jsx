import PageHeader from '../components/PageHeader'
import InicioCalidad from '../components/inicio/InicioCalidad'
import InicioLider from '../components/inicio/InicioLider'
import InicioOperario from '../components/inicio/InicioOperario'
import { useAuth } from '../context/useAuth'

const DESCRIPCIONES = {
  LIDER: 'Resumen de almacén, órdenes, consumos y formatos.',
  OPERARIO: 'Órdenes abiertas, alertas de saldo y tus últimos consumos.',
  CALIDAD: 'Formatos pendientes de tu firma y los últimos completados.',
}

export default function Inicio() {
  const { usuario, rol } = useAuth()
  return (
    <>
      <PageHeader titulo={`Bienvenido, ${usuario.nombre}`} descripcion={DESCRIPCIONES[rol]} />
      {rol === 'LIDER' && <InicioLider />}
      {rol === 'OPERARIO' && <InicioOperario />}
      {rol === 'CALIDAD' && <InicioCalidad />}
    </>
  )
}
