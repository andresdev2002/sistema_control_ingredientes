import { useCallback, useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { Link, useParams } from 'react-router-dom'
import { listarConsumos } from '../api/consumos'
import { generarFormato } from '../api/formatos'
import { obtenerOrden } from '../api/ordenes'
import useCarga from '../api/useCarga'
import ConsumosTabla from '../components/ConsumosTabla'
import ErrorAlert from '../components/ErrorAlert'
import EstadoChip from '../components/EstadoChip'
import LoadingBlock from '../components/LoadingBlock'
import Mensaje from '../components/Mensaje'
import { useAuth } from '../context/useAuth'
import { formatearFechaHora } from '../utils/formato'
import Dato from '../components/Dato'

export default function OrdenDetalle() {
  const { id } = useParams()
  const { rol } = useAuth()
  const cargarOrden = useCallback(() => obtenerOrden(id), [id])
  const cargarConsumos = useCallback(() => listarConsumos(id), [id])
  const orden = useCarga(cargarOrden)
  const consumos = useCarga(cargarConsumos)
  const [generando, setGenerando] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function handleGenerar() {
    setGenerando(true)
    setErrorAccion('')
    try {
      const formato = await generarFormato(orden.datos.id)
      setMensaje(`Formato #${formato.id} generado`)
    } catch (err) {
      setErrorAccion(err.message)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <Button component={Link} to="/ordenes" size="small" sx={{ mb: 1 }}>
        ← Volver a órdenes
      </Button>
      {orden.cargando && <LoadingBlock />}
      <ErrorAlert mensaje={orden.error} onReintentar={orden.recargar} />
      {!orden.cargando && orden.datos && (
        <>
          <Typography variant="h5" component="h1" gutterBottom>
            Orden {orden.datos.codigo_orden}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2 }}>
              <Dato titulo="Estado">
                <EstadoChip estado={orden.datos.estado} />
              </Dato>
              <Dato titulo="Producto terminado">{orden.datos.codigo_producto_terminado || '—'}</Dato>
              <Dato titulo="Turno apertura">{orden.datos.turno_apertura}</Dato>
              <Dato titulo="Abrió (ID)">{orden.datos.usuario_apertura_id}</Dato>
              <Dato titulo="Apertura">{formatearFechaHora(orden.datos.fecha_apertura)}</Dato>
              <Dato titulo="Cierre">{formatearFechaHora(orden.datos.fecha_cierre)}</Dato>
            </Box>
            {rol === 'LIDER' && orden.datos.estado === 'CERRADA' && (
              <Button variant="contained" sx={{ mt: 2 }} onClick={handleGenerar} disabled={generando}>
                {generando ? 'Generando…' : 'Generar formato'}
              </Button>
            )}
            <ErrorAlert mensaje={errorAccion} />
          </Paper>
          <Typography variant="h6" component="h2" gutterBottom>
            Consumos
          </Typography>
          <ConsumosTabla
            filas={consumos.datos}
            cargando={consumos.cargando}
            error={consumos.error}
            onReintentar={consumos.recargar}
          />
        </>
      )}
      <Mensaje texto={mensaje} onCerrar={() => setMensaje('')} />
    </>
  )
}
