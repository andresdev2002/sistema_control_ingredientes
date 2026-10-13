import { Button } from '@mui/material'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

export default function SinAcceso() {
  return (
    <>
      <PageHeader
        titulo="Sin acceso"
        descripcion="Tu rol no tiene acceso a esta pantalla."
        accion={
          <Button component={Link} to="/" variant="outlined">
            Volver al inicio
          </Button>
        }
      />
    </>
  )
}
