import { Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export default function NoEncontrado() {
  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Página no encontrada
      </Typography>
      <Button component={Link} to="/" variant="outlined">
        Volver al inicio
      </Button>
    </>
  )
}
