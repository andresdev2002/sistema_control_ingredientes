import { Button } from '@mui/material'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

export default function NoEncontrado() {
  return (
    <>
      <PageHeader
        titulo="Página no encontrada"
        descripcion="La dirección no corresponde a ninguna pantalla."
        accion={
          <Button component={Link} to="/" variant="outlined">
            Volver al inicio
          </Button>
        }
      />
    </>
  )
}
