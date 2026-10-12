import { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { actualizarMaterial } from '../api/materiales'
import ErrorAlert from './ErrorAlert'

export default function MaterialEditarDialog({ material, onCerrar, onGuardado }) {
  const [descripcion, setDescripcion] = useState(material.descripcion)
  const [unidad, setUnidad] = useState(material.unidad_medida)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento) {
    evento.preventDefault()
    const datos = { descripcion: descripcion.trim(), unidad_medida: unidad.trim() }
    if (!datos.descripcion || !datos.unidad_medida) {
      setError('Descripción y unidad de medida son obligatorias')
      return
    }
    setError('')
    setEnviando(true)
    try {
      const actualizado = await actualizarMaterial(material.codigo_sap, datos)
      onGuardado(actualizado)
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>Editar material {material.codigo_sap}</DialogTitle>
        <DialogContent>
          <ErrorAlert mensaje={error} />
          <TextField id="edit-descripcion" label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required autoFocus fullWidth margin="normal" />
          <TextField id="edit-unidad" label="Unidad de medida" value={unidad} onChange={(e) => setUnidad(e.target.value)} required fullWidth margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
