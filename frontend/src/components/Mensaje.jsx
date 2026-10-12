import { Alert, Snackbar } from '@mui/material'

export default function Mensaje({ texto, onCerrar }) {
  return (
    <Snackbar open={Boolean(texto)} autoHideDuration={4000} onClose={onCerrar}>
      <Alert severity="success" onClose={onCerrar} variant="filled">
        {texto}
      </Alert>
    </Snackbar>
  )
}
