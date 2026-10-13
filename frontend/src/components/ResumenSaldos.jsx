import { Box, Card, CardContent, LinearProgress, Typography } from '@mui/material'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import InventoryIcon from '@mui/icons-material/Inventory'
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart'
import ErrorAlert from './ErrorAlert'

function Tarjeta({ titulo, valor, detalle, icono, color, cargando }) {
  return (
    <Card sx={{ borderTop: 4, borderTopColor: `${color}.main` }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ color: `${color}.main`, display: 'flex' }}>{icono}</Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {titulo}
          </Typography>
          {cargando ? (
            <LinearProgress sx={{ my: 1.5 }} aria-label={`Cargando ${titulo}`} />
          ) : (
            <Typography variant="h4" component="p">
              {valor}
            </Typography>
          )}
          {detalle && !cargando && (
            <Typography variant="caption" color="text.secondary">
              {detalle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default function ResumenSaldos({ resumen, carga }) {
  return (
    <Box sx={{ mb: 3 }}>
      <ErrorAlert mensaje={carga.error} onReintentar={carga.recargar} />
      {!carga.error && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 2 }}>
          <Tarjeta titulo="Activos" valor={resumen.activos} icono={<InventoryIcon fontSize="large" />} color="success" cargando={carga.cargando} />
          <Tarjeta titulo="Agotados" valor={resumen.agotados} icono={<RemoveShoppingCartIcon fontSize="large" />} color="primary" cargando={carga.cargando} />
          <Tarjeta
            titulo="Por vencer o vencidos"
            valor={resumen.porVencer}
            detalle={`${resumen.vencidos} vencidos · bultos activos`}
            icono={<EventBusyIcon fontSize="large" />}
            color="error"
            cargando={carga.cargando}
          />
        </Box>
      )}
    </Box>
  )
}
