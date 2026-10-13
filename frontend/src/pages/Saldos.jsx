import { useCallback, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, MenuItem, TextField } from '@mui/material'
import { listarRecepciones } from '../api/recepciones'
import { listarSaldos } from '../api/saldos'
import useCarga from '../api/useCarga'
import DataTable from '../components/DataTable'
import EstadoChip from '../components/EstadoChip'
import PageHeader from '../components/PageHeader'
import ResumenSaldos from '../components/ResumenSaldos'
import SaldoConsulta from '../components/SaldoConsulta'
import { fechaLocalHoy, formatearDecimal, formatearFecha } from '../utils/formato'
import { clasificarVencimiento, esSaldoBajo, saldosPorVencer } from '../utils/indicadores'
import { DIAS_POR_VENCER, SALDO_BAJO_PORCENTAJE } from '../utils/umbrales'

const COLUMNAS = [
  { campo: 'codigo_barras', titulo: 'Código de barras' },
  { campo: 'codigo_sap', titulo: 'Código SAP' },
  { campo: 'lote_sap', titulo: 'Lote SAP' },
  { campo: 'lote_proveedor', titulo: 'Lote proveedor' },
  { campo: 'fecha_vencimiento', titulo: 'Vencimiento', render: (f) => formatearFecha(f.fecha_vencimiento) },
  { campo: 'cantidad_disponible', titulo: 'Disponible (kg)', alinear: 'right', render: (f) => formatearDecimal(f.cantidad_disponible) },
  { campo: 'estado', titulo: 'Estado', render: (f) => <EstadoChip estado={f.estado} /> },
]

const listarTodosLosSaldos = () => listarSaldos({})
const sinPeticion = () => Promise.resolve(null)

export default function Saldos() {
  const [estado, setEstado] = useState('')
  const [codigoSap, setCodigoSap] = useState('')
  const [filtros, setFiltros] = useState({})

  const todos = useCarga(listarTodosLosSaldos)
  const recepciones = useCarga(listarRecepciones)
  const sinFiltros = !filtros.estado && !filtros.codigo_sap
  const cargarFiltrados = useCallback(() => (sinFiltros ? sinPeticion() : listarSaldos(filtros)), [filtros, sinFiltros])
  const filtrados = useCarga(cargarFiltrados)
  const tabla = sinFiltros ? todos : filtrados
  const hoy = fechaLocalHoy()

  const resumen = useMemo(() => {
    const lista = todos.datos || []
    const proximos = saldosPorVencer(lista, hoy, DIAS_POR_VENCER)
    return {
      activos: lista.filter((s) => s.estado === 'ACTIVO').length,
      agotados: lista.filter((s) => s.estado === 'AGOTADO').length,
      porVencer: proximos.length,
      vencidos: proximos.filter((p) => p.clase === 'VENCIDO').length,
    }
  }, [todos.datos, hoy])

  const recibidas = useMemo(() => new Map((recepciones.datos || []).map((r) => [r.id, r.cantidad_recibida])), [recepciones.datos])

  function resaltarFila(saldo) {
    if (saldo.estado !== 'ACTIVO') return null
    if (clasificarVencimiento(saldo.fecha_vencimiento, hoy, DIAS_POR_VENCER) === 'VENCIDO') return 'error'
    const recibida = saldo.origen_recepcion_id != null ? recibidas.get(saldo.origen_recepcion_id) : undefined
    if (recibida && esSaldoBajo(saldo.cantidad_disponible, recibida, SALDO_BAJO_PORCENTAJE)) return 'warning'
    return null
  }

  function handleSubmit(evento) {
    evento.preventDefault()
    const nuevos = { estado, codigo_sap: codigoSap.trim() }
    if (!nuevos.estado && !nuevos.codigo_sap) todos.recargar()
    setFiltros(nuevos)
  }

  return (
    <>
      <PageHeader titulo="Saldos" descripcion="Cantidad disponible de cada bulto en almacén." />
      <ResumenSaldos resumen={resumen} carga={todos} />
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
      {recepciones.error ? (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={recepciones.recargar}>
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar las recepciones; los saldos bajos no se resaltan. {recepciones.error}
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Chip size="small" sx={{ bgcolor: 'warning.light' }} label={`Saldo bajo: ${SALDO_BAJO_PORCENTAJE}% o menos de lo recibido`} />
          <Chip size="small" sx={{ bgcolor: 'error.light' }} label="Vencido" />
        </Box>
      )}
      <DataTable
        columnas={COLUMNAS}
        filas={tabla.datos}
        claveFila="id"
        cargando={tabla.cargando}
        error={tabla.error}
        onReintentar={tabla.recargar}
        resaltarFila={resaltarFila}
      />
    </>
  )
}
