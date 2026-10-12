import { useState } from 'react'
import { Box, Button, Paper, TextField, Typography } from '@mui/material'
import { crearOrden } from '../api/ordenes'
import ErrorAlert from './ErrorAlert'
import TurnoSelect from './TurnoSelect'

const VACIO = { codigo_orden: '', codigo_producto_terminado: '', turno_apertura: '' }

export default function OrdenCrearForm({ onCreada }) {
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function handleSubmit(evento) {
    evento.preventDefault()
    const datos = { codigo_orden: form.codigo_orden.trim(), turno_apertura: form.turno_apertura }
    const producto = form.codigo_producto_terminado.trim()
    if (producto) datos.codigo_producto_terminado = producto
    if (!datos.codigo_orden || !datos.turno_apertura) {
      setError('Código de orden y turno son obligatorios')
      return
    }
    setError('')
    setEnviando(true)
    try {
      const orden = await crearOrden(datos)
      setForm(VACIO)
      onCreada(orden)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" component="h2">
        Nueva orden de producción
      </Typography>
      <ErrorAlert mensaje={error} />
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
        <TextField id="orden-codigo" label="Código de orden" value={form.codigo_orden} onChange={cambiar('codigo_orden')} required autoFocus size="small" />
        <TextField id="orden-producto" label="Producto terminado (opcional)" value={form.codigo_producto_terminado} onChange={cambiar('codigo_producto_terminado')} size="small" />
        <TurnoSelect id="orden-turno" label="Turno de apertura" value={form.turno_apertura} onChange={cambiar('turno_apertura')} />
        <Button type="submit" variant="contained" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear'}
        </Button>
      </Box>
    </Paper>
  )
}
