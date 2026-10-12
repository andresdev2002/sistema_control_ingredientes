import { Alert, Box, Typography } from '@mui/material'

function Peso({ titulo, valor }) {
  return (
    <Box>
      <Typography variant="caption">{titulo}</Typography>
      <Typography variant="h6" component="p">
        {valor} kg
      </Typography>
    </Box>
  )
}

export default function ConsumoResultado({ consumo, codigoBarras, onCerrar }) {
  return (
    <Alert severity="success" sx={{ mb: 3 }} onClose={onCerrar}>
      <Typography variant="body2">Consumo registrado del bulto {codigoBarras}</Typography>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mt: 1 }}>
        <Peso titulo="Peso capturado" valor={consumo.peso_capturado} />
        <Peso titulo="Peso redondeado" valor={consumo.peso_redondeado} />
        <Peso titulo="Cantidad sobrante" valor={consumo.cantidad_sobrante} />
      </Box>
    </Alert>
  )
}
