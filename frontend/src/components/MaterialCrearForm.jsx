import { useState } from 'react'
import { Box, Button, Paper, TextField, Typography } from '@mui/material'
import { crearMaterial } from '../api/materiales'
import ErrorAlert from './ErrorAlert'

const VACIO = { codigo_sap: '', descripcion: '', unidad_medida: 'KG' }

export default function MaterialCrearForm({ onCreado }) {
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function handleSubmit(evento) {
    evento.preventDefault()
    const datos = {
      codigo_sap: form.codigo_sap.trim(),
      descripcion: form.descripcion.trim(),
      unidad_medida: form.unidad_medida.trim(),
    }
    if (!datos.codigo_sap || !datos.descripcion) {
      setError('Código SAP y descripción son obligatorios')
      return
    }
    if (!datos.unidad_medida) delete datos.unidad_medida
    setError('')
    setEnviando(true)
    try {
      const material = await crearMaterial(datos)
      setForm(VACIO)
      onCreado(material)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" component="h2">
        Nuevo material
      </Typography>
      <ErrorAlert mensaje={error} />
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
        <TextField id="mat-codigo" label="Código SAP" value={form.codigo_sap} onChange={cambiar('codigo_sap')} required autoFocus size="small" />
        <TextField id="mat-descripcion" label="Descripción" value={form.descripcion} onChange={cambiar('descripcion')} required size="small" sx={{ minWidth: 280 }} />
        <TextField id="mat-unidad" label="Unidad de medida" value={form.unidad_medida} onChange={cambiar('unidad_medida')} size="small" />
        <Button type="submit" variant="contained" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear'}
        </Button>
      </Box>
    </Paper>
  )
}
