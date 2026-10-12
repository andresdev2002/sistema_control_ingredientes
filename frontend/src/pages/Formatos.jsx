import { useMemo } from 'react'
import { Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { listarFormatos } from '../api/formatos'
import { listarOrdenes } from '../api/ordenes'
import useCarga from '../api/useCarga'
import DataTable from '../components/DataTable'
import EstadoChip from '../components/EstadoChip'
import { formatearFechaHora } from '../utils/formato'

export default function Formatos() {
  const formatos = useCarga(listarFormatos)
  const ordenes = useCarga(listarOrdenes)

  const codigos = useMemo(() => {
    const mapa = {}
    ;(ordenes.datos || []).forEach((o) => {
      mapa[o.id] = o.codigo_orden
    })
    return mapa
  }, [ordenes.datos])

  const columnas = [
    { campo: 'id', titulo: 'Formato' },
    { campo: 'orden_produccion_id', titulo: 'Orden', render: (f) => codigos[f.orden_produccion_id] ?? `ID ${f.orden_produccion_id}` },
    { campo: 'estado', titulo: 'Estado', render: (f) => <EstadoChip estado={f.estado} /> },
    { campo: 'generado_por', titulo: 'Generado por (ID)' },
    { campo: 'fecha_generacion', titulo: 'Generación', render: (f) => formatearFechaHora(f.fecha_generacion) },
    {
      campo: 'acciones',
      titulo: 'Acciones',
      render: (f) => (
        <Button size="small" component={Link} to={`/formatos/${f.id}`}>
          Ver
        </Button>
      ),
    },
  ]

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Formatos FO-PFTO-0057
      </Typography>
      <DataTable
        columnas={columnas}
        filas={formatos.datos}
        claveFila="id"
        cargando={formatos.cargando}
        error={formatos.error}
        onReintentar={formatos.recargar}
      />
    </>
  )
}
