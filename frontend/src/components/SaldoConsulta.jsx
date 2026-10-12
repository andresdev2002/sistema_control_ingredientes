import { useState } from 'react'
import { Box, Button, Paper, TextField, Typography } from '@mui/material'
import { consultarSaldo } from '../api/saldos'
import { formatearDecimal, formatearFecha, formatearFechaHora } from '../utils/formato'
import ErrorAlert from './ErrorAlert'
import EstadoChip from './EstadoChip'
import LoadingBlock from './LoadingBlock'

function Dato({ titulo, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {titulo}
      </Typography>
      <Typography>{children}</Typography>
    </Box>
  )
}

export default function SaldoConsulta() {
  const [codigo, setCodigo] = useState('')
  const [saldo, setSaldo] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(evento) {
    evento.preventDefault()
    const valor = codigo.trim()
    if (!valor) {
      setError('Escribe o escanea un código de barras')
      return
    }
    setError('')
    setSaldo(null)
    setCargando(true)
    try {
      setSaldo(await consultarSaldo(valor))
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" component="h2">
        Consultar por código de barras
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
        <TextField id="saldo-codigo" label="Código de barras" value={codigo} onChange={(e) => setCodigo(e.target.value)} required autoFocus size="small" />
        <Button type="submit" variant="contained" disabled={cargando}>
          Consultar
        </Button>
      </Box>
      <ErrorAlert mensaje={error} />
      {cargando && <LoadingBlock />}
      {saldo && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2, mt: 2 }}>
          <Dato titulo="Código de barras">{saldo.codigo_barras}</Dato>
          <Dato titulo="Estado">
            <EstadoChip estado={saldo.estado} />
          </Dato>
          <Dato titulo="Código SAP">{saldo.codigo_sap}</Dato>
          <Dato titulo="Lote SAP">{saldo.lote_sap}</Dato>
          <Dato titulo="Lote proveedor">{saldo.lote_proveedor}</Dato>
          <Dato titulo="Vencimiento">{formatearFecha(saldo.fecha_vencimiento)}</Dato>
          <Dato titulo="Cantidad disponible (kg)">{formatearDecimal(saldo.cantidad_disponible)}</Dato>
          <Dato titulo="Recepción de origen (ID)">{saldo.origen_recepcion_id ?? '—'}</Dato>
          <Dato titulo="Fecha creación">{formatearFechaHora(saldo.fecha_creacion)}</Dato>
        </Box>
      )}
    </Paper>
  )
}
