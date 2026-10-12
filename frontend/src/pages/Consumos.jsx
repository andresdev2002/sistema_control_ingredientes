import { useCallback, useMemo, useState } from 'react'
import { MenuItem, TextField, Typography } from '@mui/material'
import { listarConsumos } from '../api/consumos'
import { listarOrdenes } from '../api/ordenes'
import useCarga from '../api/useCarga'
import ConsumosTabla from '../components/ConsumosTabla'
import ErrorAlert from '../components/ErrorAlert'

export default function Consumos() {
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
      <Typography variant="h5" component="h1" gutterBottom>
        Consumos
      </Typography>
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
