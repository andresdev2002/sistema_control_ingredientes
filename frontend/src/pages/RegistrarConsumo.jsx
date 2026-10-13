import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, MenuItem, Paper, TextField } from '@mui/material'
import { registrarConsumo } from '../api/consumos'
import { obtenerMaterial } from '../api/materiales'
import { listarOrdenes } from '../api/ordenes'
import { consultarSaldo } from '../api/saldos'
import useCarga from '../api/useCarga'
import ConsumoResultado from '../components/ConsumoResultado'
import ErrorAlert from '../components/ErrorAlert'
import LoadingBlock from '../components/LoadingBlock'
import Mensaje from '../components/Mensaje'
import SaldoResumen from '../components/SaldoResumen'
import TurnoSelect from '../components/TurnoSelect'
import { esNumeroPositivo, normalizarDecimal } from '../utils/formato'
import PageHeader from '../components/PageHeader'

const SIN_SALDO = { codigo: '', datos: null, descripcion: '', error: '', cargando: false }

const CAMPO_GRANDE = { '& .MuiInputBase-input': { fontSize: '1.35rem', py: 1.75 }, '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': { fontSize: '1.15rem' } }

export default function RegistrarConsumo() {
  const ordenes = useCarga(listarOrdenes)
  const [ordenId, setOrdenId] = useState('')
  const [turno, setTurno] = useState('')
  const [codigo, setCodigo] = useState('')
  const [peso, setPeso] = useState('')
  const [saldo, setSaldo] = useState(SIN_SALDO)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const codigoRef = useRef(null)
  const pesoRef = useRef(null)
  const ultimaConsulta = useRef('')
  const debeEnfocarCodigo = useRef(false)

  const abiertas = (ordenes.datos || []).filter((o) => o.estado === 'ABIERTA')

  useEffect(() => {
    if (debeEnfocarCodigo.current && !enviando) {
      debeEnfocarCodigo.current = false
      codigoRef.current?.focus()
    }
  }, [enviando])

  async function consultar(valor) {
    if (!valor || valor === ultimaConsulta.current) return
    ultimaConsulta.current = valor
    setSaldo({ ...SIN_SALDO, codigo: valor, cargando: true })
    try {
      const datos = await consultarSaldo(valor)
      let descripcion = ''
      try {
        descripcion = (await obtenerMaterial(datos.codigo_sap)).descripcion
      } catch {
        descripcion = ''
      }
      if (ultimaConsulta.current === valor) setSaldo({ ...SIN_SALDO, codigo: valor, datos, descripcion })
    } catch (err) {
      if (ultimaConsulta.current === valor) setSaldo({ ...SIN_SALDO, codigo: valor, error: err.message })
    }
  }

  function cambiarCodigo(e) {
    setCodigo(e.target.value)
    if (e.target.value.trim() !== ultimaConsulta.current) {
      ultimaConsulta.current = ''
      setSaldo(SIN_SALDO)
    }
  }

  function teclaEnCodigo(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      consultar(codigo.trim())
      pesoRef.current?.focus()
    }
  }

  const agotado = saldo.datos?.estado === 'AGOTADO'

  async function handleSubmit(evento) {
    evento.preventDefault()
    if (agotado) return
    const codigoBarras = codigo.trim()
    const pesoCapturado = normalizarDecimal(peso)
    if (!ordenId || !codigoBarras || !turno) {
      setError('Orden, código de barras y turno son obligatorios')
      return
    }
    if (!esNumeroPositivo(pesoCapturado)) {
      setError('El peso debe ser un número mayor que 0')
      return
    }
    setError('')
    setEnviando(true)
    try {
      const consumo = await registrarConsumo({
        orden_produccion_id: Number(ordenId),
        codigo_barras: codigoBarras,
        peso_capturado: pesoCapturado,
        turno,
      })
      setResultado({ consumo, codigoBarras })
      setMensaje('Consumo registrado')
      setCodigo('')
      setPeso('')
      ultimaConsulta.current = ''
      setSaldo(SIN_SALDO)
      debeEnfocarCodigo.current = true
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <PageHeader titulo="Registrar consumo" descripcion="Escanea el bulto, captura el peso de la báscula y registra." />
      {resultado && (
        <ConsumoResultado consumo={resultado.consumo} codigoBarras={resultado.codigoBarras} onCerrar={() => setResultado(null)} />
      )}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        {ordenes.cargando && <LoadingBlock />}
        <ErrorAlert mensaje={ordenes.error} onReintentar={ordenes.recargar} />
        {!ordenes.cargando && !ordenes.error && abiertas.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No hay órdenes abiertas
          </Alert>
        )}
        <ErrorAlert mensaje={error} />
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
            <TextField
              id="consumo-orden"
              select
              label="Orden de producción"
              value={ordenId}
              onChange={(e) => setOrdenId(e.target.value)}
              required
              fullWidth
              sx={CAMPO_GRANDE}
              disabled={ordenes.cargando}
            >
              {abiertas.map((o) => (
                <MenuItem key={o.id} value={String(o.id)}>
                  {o.codigo_orden}
                  {o.codigo_producto_terminado ? ` — ${o.codigo_producto_terminado}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TurnoSelect id="consumo-turno" value={turno} onChange={(e) => setTurno(e.target.value)} size="medium" sx={CAMPO_GRANDE} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr auto' }, gap: 2, mt: 2, alignItems: 'stretch' }}>
            <TextField
              id="consumo-codigo"
              label="Código de barras del bulto"
              value={codigo}
              onChange={cambiarCodigo}
              onBlur={() => consultar(codigo.trim())}
              onKeyDown={teclaEnCodigo}
              inputRef={codigoRef}
              autoFocus
              required
              fullWidth
              sx={CAMPO_GRANDE}
              autoComplete="off"
            />
            <TextField
              id="consumo-peso"
              label="Peso (kg)"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              inputRef={pesoRef}
              required
              fullWidth
              sx={CAMPO_GRANDE}
              autoComplete="off"
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <Button type="submit" variant="contained" size="large" disabled={enviando || agotado} sx={{ minHeight: 60, px: 5, fontSize: '1.15rem' }}>
              {enviando ? 'Registrando…' : 'Registrar'}
            </Button>
          </Box>
        </Box>
        {saldo.cargando && <LoadingBlock />}
        <ErrorAlert mensaje={saldo.error} />
        {saldo.datos && <SaldoResumen saldo={saldo.datos} descripcion={saldo.descripcion} />}
      </Paper>
      <Mensaje texto={mensaje} onCerrar={() => setMensaje('')} />
    </>
  )
}
