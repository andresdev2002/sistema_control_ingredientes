import { useState } from 'react'
import { Alert, Button, Typography } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

export default function CodigoBarrasDestacado({ codigo, onCerrar }) {
  const [copiado, setCopiado] = useState('')

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado('Copiado')
    } catch {
      setCopiado('No se pudo copiar; selecciona el código manualmente')
    }
  }

  return (
    <Alert
      severity="success"
      sx={{ mb: 3, alignItems: 'center' }}
      onClose={onCerrar}
      action={
        <Button color="inherit" size="small" startIcon={<ContentCopyIcon />} onClick={copiar}>
          Copiar
        </Button>
      }
    >
      <Typography variant="body2">Recepción registrada. Código de barras del bulto:</Typography>
      <Typography variant="h5" component="p" sx={{ fontFamily: 'monospace', userSelect: 'all' }}>
        {codigo}
      </Typography>
      {copiado && <Typography variant="caption">{copiado}</Typography>}
    </Alert>
  )
}
