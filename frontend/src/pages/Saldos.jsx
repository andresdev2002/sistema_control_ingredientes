import { useCallback, useState } from 'react'
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { listarSaldos } from '../api/saldos'
import useCarga from '../api/useCarga'
import DataTable from '../components/DataTable'
import EstadoChip from '../components/EstadoChip'
import SaldoConsulta from '../components/SaldoConsulta'
import { formatearDecimal, formatearFecha } from '../utils/formato'

const COLUMNAS = [
  { campo: 'codigo_barras', titulo: 'Código de barras' },
  { campo: 'codigo_sap', titulo: 'Código SAP' },
  { campo: 'lote_sap', titulo: 'Lote SAP' },
  { campo: 'lote_proveedor', titulo: 'Lote proveedor' },
  { campo: 'fecha_vencimiento', titulo: 'Vencimiento', render: (f) => formatearFecha(f.fecha_vencimiento) },
  { campo: 'cantidad_disponible', titulo: 'Disponible (kg)', alinear: 'right', render: (f) => formatearDecimal(f.cantidad_disponible) },
  { campo: 'estado', titulo: 'Estado', render: (f) => <EstadoChip estado={f.estado} /> },
]

export default function Saldos() {
  const [estado, setEstado] = useState('')
  const [codigoSap, setCodigoSap] = useState('')
  const [filtros, setFiltros] = useState({})

  const cargar = useCallback(() => listarSaldos(filtros), [filtros])
  const { datos, cargando, error, recargar } = useCarga(cargar)

  function handleSubmit(evento) {
    evento.preventDefault()
    setFiltros({ estado, codigo_sap: codigoSap.trim() })
  }

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Saldos
      </Typography>
      <SaldoConsulta />
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField id="filtro-estado" select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} size="small" sx={{ minWidth: 160 }}>
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="ACTIVO">ACTIVO</MenuItem>
          <MenuItem value="AGOTADO">AGOTADO</MenuItem>
        </TextField>
        <TextField id="filtro-sap" label="Código SAP" value={codigoSap} onChange={(e) => setCodigoSap(e.target.value)} size="small" />
        <Button type="submit" variant="outlined">
          Filtrar
        </Button>
      </Box>
      <DataTable columnas={COLUMNAS} filas={datos} claveFila="id" cargando={cargando} error={error} onReintentar={recargar} />
    </>
  )
}
