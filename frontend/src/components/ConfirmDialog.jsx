import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

export default function ConfirmDialog({ abierto, titulo, mensaje, textoConfirmar = 'Confirmar', enviando, onConfirmar, onCancelar }) {
  return (
    <Dialog open={abierto} onClose={enviando ? undefined : onCancelar}>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{mensaje}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button onClick={onConfirmar} variant="contained" disabled={enviando} autoFocus>
          {enviando ? 'Procesando…' : textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
