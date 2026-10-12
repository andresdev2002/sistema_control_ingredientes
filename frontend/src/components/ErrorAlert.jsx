import { Alert, Button } from '@mui/material'

export default function ErrorAlert({ mensaje, onReintentar }) {
  if (!mensaje) return null
  return (
    <Alert
      severity="error"
      sx={{ my: 2 }}
      action={
        onReintentar ? (
          <Button color="inherit" size="small" onClick={onReintentar}>
            Reintentar
          </Button>
        ) : null
      }
    >
      {mensaje}
    </Alert>
  )
}
