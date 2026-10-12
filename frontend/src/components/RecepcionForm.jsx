import { useState } from 'react'
import { Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material'
import { listarMateriales } from '../api/materiales'
import { crearRecepcion } from '../api/recepciones'
import useCarga from '../api/useCarga'
import { esFechaValida, esNumeroPositivo, normalizarDecimal } from '../utils/formato'
import ErrorAlert from './ErrorAlert'

const VACIO = {
  codigo_sap: '',
  lote_sap: '',
  lote_proveedor: '',
  fecha_vencimiento: '',
  cantidad_recibida: '',
  codigo_barras: '',
}

export default function RecepcionForm({ onCreada }) {
  const materiales = useCarga(listarMateriales)
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function handleSubmit(evento) {
    evento.preventDefault()
    const datos = {
      codigo_sap: form.codigo_sap,
      lote_sap: form.lote_sap.trim(),
      lote_proveedor: form.lote_proveedor.trim(),
      fecha_vencimiento: form.fecha_vencimiento,
      cantidad_recibida: normalizarDecimal(form.cantidad_recibida),
    }
    const codigoBarras = form.codigo_barras.trim()
    if (codigoBarras) datos.codigo_barras = codigoBarras

    if (!datos.codigo_sap || !datos.lote_sap || !datos.lote_proveedor) {
      setError('Material, lote SAP y lote proveedor son obligatorios')
      return
    }
    if (!esFechaValida(datos.fecha_vencimiento)) {
      setError('La fecha de vencimiento no es válida')
      return
    }
    if (!esNumeroPositivo(datos.cantidad_recibida)) {
      setError('La cantidad recibida debe ser un número mayor que 0')
      return
    }

    setError('')
    setEnviando(true)
    try {
      const recepcion = await crearRecepcion(datos)
      setForm(VACIO)
      onCreada(recepcion)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" component="h2">
        Nueva recepción
      </Typography>
      <ErrorAlert mensaje={materiales.error} onReintentar={materiales.recargar} />
      <ErrorAlert mensaje={error} />
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
        <TextField
          id="rec-material"
          select
          label="Material"
          value={form.codigo_sap}
          onChange={cambiar('codigo_sap')}
          required
          autoFocus
          size="small"
          sx={{ minWidth: 260 }}
          disabled={materiales.cargando}
        >
          {(materiales.datos || []).map((m) => (
            <MenuItem key={m.codigo_sap} value={m.codigo_sap}>
              {m.codigo_sap} — {m.descripcion}
            </MenuItem>
          ))}
        </TextField>
        <TextField id="rec-lote-sap" label="Lote SAP" value={form.lote_sap} onChange={cambiar('lote_sap')} required size="small" />
        <TextField id="rec-lote-proveedor" label="Lote proveedor" value={form.lote_proveedor} onChange={cambiar('lote_proveedor')} required size="small" />
        <TextField
          id="rec-vencimiento"
          label="Fecha de vencimiento"
          type="date"
          value={form.fecha_vencimiento}
          onChange={cambiar('fecha_vencimiento')}
          required
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          id="rec-cantidad"
          label="Cantidad recibida (kg)"
          value={form.cantidad_recibida}
          onChange={cambiar('cantidad_recibida')}
          required
          size="small"
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
        />
        <TextField
          id="rec-codigo-barras"
          label="Código de barras (opcional)"
          value={form.codigo_barras}
          onChange={cambiar('codigo_barras')}
          size="small"
          helperText="Si se deja vacío, lo genera el sistema"
        />
        <Box>
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Registrar'}
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
