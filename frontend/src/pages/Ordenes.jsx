import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { cerrarOrden, listarOrdenes } from '../api/ordenes'
import useCarga from '../api/useCarga'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import EstadoChip from '../components/EstadoChip'
import Mensaje from '../components/Mensaje'
import OrdenCrearForm from '../components/OrdenCrearForm'
import { useAuth } from '../context/useAuth'
import { formatearFechaHora } from '../utils/formato'

export default function Ordenes() {
  const { rol } = useAuth()
  const esLider = rol === 'LIDER'
  const { datos, cargando, error, recargar } = useCarga(listarOrdenes)
  const [porCerrar, setPorCerrar] = useState(null)
  const [cerrando, setCerrando] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function confirmarCierre() {
    setCerrando(true)
    setErrorAccion('')
    try {
      const orden = await cerrarOrden(porCerrar.id)
      setMensaje(`Orden ${orden.codigo_orden} cerrada`)
      recargar()
    } catch (err) {
      setErrorAccion(err.message)
    } finally {
      setCerrando(false)
      setPorCerrar(null)
    }
  }

  const columnas = [
    { campo: 'codigo_orden', titulo: 'Código de orden' },
    { campo: 'codigo_producto_terminado', titulo: 'Producto terminado', render: (f) => f.codigo_producto_terminado || '—' },
    { campo: 'estado', titulo: 'Estado', render: (f) => <EstadoChip estado={f.estado} /> },
    { campo: 'turno_apertura', titulo: 'Turno apertura' },
    { campo: 'usuario_apertura_id', titulo: 'Abrió (ID)' },
    { campo: 'fecha_apertura', titulo: 'Apertura', render: (f) => formatearFechaHora(f.fecha_apertura) },
    { campo: 'fecha_cierre', titulo: 'Cierre', render: (f) => formatearFechaHora(f.fecha_cierre) },
    {
      campo: 'acciones',
      titulo: 'Acciones',
      render: (f) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" component={Link} to={`/ordenes/${f.id}`}>
            Ver
          </Button>
          {esLider && f.estado === 'ABIERTA' && (
            <Button size="small" color="warning" onClick={() => setPorCerrar(f)}>
              Cerrar
            </Button>
          )}
        </Box>
      ),
    },
  ]

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Órdenes de producción
      </Typography>
      {esLider && (
        <OrdenCrearForm
          onCreada={(orden) => {
            setMensaje(`Orden ${orden.codigo_orden} creada`)
            recargar()
          }}
        />
      )}
      <ErrorAlert mensaje={errorAccion} />
      <DataTable columnas={columnas} filas={datos} claveFila="id" cargando={cargando} error={error} onReintentar={recargar} />
      <ConfirmDialog
        abierto={Boolean(porCerrar)}
        titulo={`Cerrar orden ${porCerrar?.codigo_orden ?? ''}`}
        mensaje="Al cerrar no se podrán registrar más consumos"
        textoConfirmar="Cerrar orden"
        enviando={cerrando}
        onConfirmar={confirmarCierre}
        onCancelar={() => setPorCerrar(null)}
      />
      <Mensaje texto={mensaje} onCerrar={() => setMensaje('')} />
    </>
  )
}
