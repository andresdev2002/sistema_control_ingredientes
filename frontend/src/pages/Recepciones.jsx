import { useState } from 'react'
import { Typography } from '@mui/material'
import { listarRecepciones } from '../api/recepciones'
import useCarga from '../api/useCarga'
import CodigoBarrasDestacado from '../components/CodigoBarrasDestacado'
import DataTable from '../components/DataTable'
import Mensaje from '../components/Mensaje'
import RecepcionForm from '../components/RecepcionForm'
import { useAuth } from '../context/useAuth'
import { formatearDecimal, formatearFecha, formatearFechaHora } from '../utils/formato'

const COLUMNAS = [
  { campo: 'codigo_barras', titulo: 'Código de barras' },
  { campo: 'codigo_sap', titulo: 'Código SAP' },
  { campo: 'lote_sap', titulo: 'Lote SAP' },
  { campo: 'lote_proveedor', titulo: 'Lote proveedor' },
  { campo: 'fecha_vencimiento', titulo: 'Vencimiento', render: (f) => formatearFecha(f.fecha_vencimiento) },
  { campo: 'cantidad_recibida', titulo: 'Cantidad (kg)', alinear: 'right', render: (f) => formatearDecimal(f.cantidad_recibida) },
  { campo: 'usuario_id', titulo: 'Usuario (ID)' },
  { campo: 'fecha_recepcion', titulo: 'Fecha recepción', render: (f) => formatearFechaHora(f.fecha_recepcion) },
]

export default function Recepciones() {
  const { rol } = useAuth()
  const { datos, cargando, error, recargar } = useCarga(listarRecepciones)
  const [codigoNuevo, setCodigoNuevo] = useState('')
  const [mensaje, setMensaje] = useState('')

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Recepciones
      </Typography>
      {rol === 'LIDER' && (
        <RecepcionForm
          onCreada={(recepcion) => {
            setCodigoNuevo(recepcion.codigo_barras)
            setMensaje('Recepción registrada')
            recargar()
          }}
        />
      )}
      {codigoNuevo && <CodigoBarrasDestacado codigo={codigoNuevo} onCerrar={() => setCodigoNuevo('')} />}
      <DataTable columnas={COLUMNAS} filas={datos} claveFila="id" cargando={cargando} error={error} onReintentar={recargar} />
      <Mensaje texto={mensaje} onCerrar={() => setMensaje('')} />
    </>
  )
}
