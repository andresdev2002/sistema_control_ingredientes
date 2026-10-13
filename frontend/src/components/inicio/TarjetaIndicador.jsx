import { Box, Button, Card, CardActions, CardContent, LinearProgress, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { Link } from 'react-router-dom'
import ErrorAlert from '../ErrorAlert'

export default function TarjetaIndicador({ titulo, icono, color = 'primary', valor, detalle, carga, vacio, textoVacio, enlace, destacada, children }) {
  const listo = !carga.cargando && !carga.error
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderTop: 4,
        borderTopColor: `${color}.main`,
        ...(destacada && { boxShadow: 3, borderColor: `${color}.main` }),
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ color: `${color}.main`, display: 'flex' }}>{icono}</Box>
          <Typography variant="subtitle1" component="h2" sx={{ flexGrow: 1 }}>
            {titulo}
          </Typography>
          {listo && valor !== undefined && (
            <Typography variant="h4" component="p" sx={{ color: `${color}.main`, lineHeight: 1 }}>
              {valor}
            </Typography>
          )}
        </Box>
        {listo && detalle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {detalle}
          </Typography>
        )}
        {carga.cargando && <LinearProgress sx={{ my: 2 }} aria-label={`Cargando ${titulo}`} />}
        <ErrorAlert mensaje={carga.error} onReintentar={carga.recargar} />
        {listo && vacio && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', py: 2 }}>
            <InboxOutlinedIcon fontSize="small" />
            <Typography variant="body2">{textoVacio || 'No hay registros'}</Typography>
          </Box>
        )}
        {listo && !vacio && children}
      </CardContent>
      {enlace && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button component={Link} to={enlace.ruta} size="small" endIcon={<ArrowForwardIcon />}>
            {enlace.texto}
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
