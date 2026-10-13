import { Box, IconButton, Paper, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'

function Peso({ titulo, valor, destacado }) {
  return (
    <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.16)', borderRadius: 2, px: 2, py: 1.5, minWidth: 150, flex: 1 }}>
      <Typography variant="body2" sx={{ opacity: 0.9 }}>
        {titulo}
      </Typography>
      <Typography variant={destacado ? 'h4' : 'h5'} component="p" sx={{ fontWeight: 700 }}>
        {valor} kg
      </Typography>
    </Box>
  )
}

export default function ConsumoResultado({ consumo, codigoBarras, onCerrar }) {
  return (
    <Paper role="status" elevation={0} sx={{ bgcolor: 'success.main', color: 'success.contrastText', p: { xs: 2, md: 3 }, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <CheckCircleIcon sx={{ fontSize: 36 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" component="p">
            Consumo registrado
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, wordBreak: 'break-all' }}>
            Bulto {codigoBarras}
          </Typography>
        </Box>
        <IconButton onClick={onCerrar} aria-label="Cerrar" sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Peso titulo="Peso capturado" valor={consumo.peso_capturado} />
        <Peso titulo="Peso redondeado" valor={consumo.peso_redondeado} destacado />
        <Peso titulo="Cantidad sobrante" valor={consumo.cantidad_sobrante} />
      </Box>
    </Paper>
  )
}
