import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import BoltIcon from '@mui/icons-material/Bolt'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ScaleIcon from '@mui/icons-material/Scale'
import { Link } from 'react-router-dom'

const ACCESOS = [
  { ruta: '/consumos/registrar', texto: 'Registrar consumo', icono: <ScaleIcon /> },
  { ruta: '/recepciones', texto: 'Nueva recepción', icono: <LocalShippingIcon /> },
  { ruta: '/ordenes', texto: 'Nueva orden', icono: <AddCircleOutlinedIcon /> },
]

export default function AccesosRapidos() {
  return (
    <Card sx={{ borderTop: 4, borderTopColor: 'primary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <BoltIcon color="primary" />
          <Typography variant="subtitle1" component="h2">
            Accesos rápidos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {ACCESOS.map((a) => (
            <Button key={a.ruta} component={Link} to={a.ruta} variant="outlined" startIcon={a.icono} size="large" sx={{ justifyContent: 'flex-start' }}>
              {a.texto}
            </Button>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
