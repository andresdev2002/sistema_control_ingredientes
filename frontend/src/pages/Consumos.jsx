import { useCallback, useMemo, useState } from 'react'
import { Button, MenuItem, TextField } from '@mui/material'
import { listarConsumos } from '../api/consumos'
import { listarOrdenes } from '../api/ordenes'
import useCarga from '../api/useCarga'
import ConsumosTabla from '../components/ConsumosTabla'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../context/useAuth'
import ScaleIcon from '@mui/icons-material/Scale'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

export default function Consumos() {
  const { rol } = useAuth()
  const [ordenId, setOrdenId] = useState('')
  const ordenes = useCarga(listarOrdenes)
  const cargar = useCallback(() => listarConsumos(ordenId), [ordenId])
  const consumos = useCarga(cargar)

  const codigos = useMemo(() => {
    const mapa = {}
    ;(ordenes.datos || []).forEach((o) => {
      mapa[o.id] = o.codigo_orden
    })
    return mapa
  }, [ordenes.datos])

  const columnaOrden = [
    { campo: 'orden_produccion_id', titulo: 'Orden', render: (f) => codigos[f.orden_produccion_id] ?? `ID ${f.orden_produccion_id}` },
  ]

  return (
    <>
      <PageHeader
        titulo="Consumos"
        descripcion="Pesajes registrados contra las órdenes de producción."
        accion={
          rol !== 'CALIDAD' && (
            <Button component={Link} to="/consumos/registrar" variant="contained" startIcon={<ScaleIcon />}>
              Registrar consumo
            </Button>
          )
        }
      />
      <ErrorAlert mensaje={ordenes.error} onReintentar={ordenes.recargar} />
      <TextField
        id="filtro-orden"
        select
        label="Orden de producción"
        value={ordenId}
        onChange={(e) => setOrdenId(e.target.value)}
        size="small"
        sx={{ minWidth: 260, mb: 2 }}
        disabled={ordenes.cargando}
      >
        <MenuItem value="">Todas</MenuItem>
        {(ordenes.datos || []).map((o) => (
          <MenuItem key={o.id} value={String(o.id)}>
            {o.codigo_orden} ({o.estado})
          </MenuItem>
        ))}
      </TextField>
      <ConsumosTabla
        columnasExtra={columnaOrden}
        filas={consumos.datos}
        cargando={consumos.cargando}
        error={consumos.error}
        onReintentar={consumos.recargar}
      />
    </>
  )
}
