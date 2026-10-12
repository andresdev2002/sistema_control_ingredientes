import { Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export default function SinAcceso() {
  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Sin acceso
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        Tu rol no tiene acceso a esta pantalla.
      </Typography>
      <Button component={Link} to="/" variant="outlined">
        Volver al inicio
      </Button>
    </>
  )
}
