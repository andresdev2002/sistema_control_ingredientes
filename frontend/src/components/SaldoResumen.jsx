import { Alert, Box } from '@mui/material'
import { formatearDecimal, formatearFecha } from '../utils/formato'
import EstadoChip from './EstadoChip'
import Dato from './Dato'

export default function SaldoResumen({ saldo, descripcion }) {
  return (
    <Box sx={{ my: 2 }}>
      {saldo.estado === 'AGOTADO' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Este bulto está AGOTADO. No se puede registrar consumo.
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 2 }}>
        <Dato titulo="Material">
          {saldo.codigo_sap}
          {descripcion ? ` — ${descripcion}` : ''}
        </Dato>
        <Dato titulo="Lote SAP">{saldo.lote_sap}</Dato>
        <Dato titulo="Lote proveedor">{saldo.lote_proveedor}</Dato>
        <Dato titulo="Vencimiento">{formatearFecha(saldo.fecha_vencimiento)}</Dato>
        <Dato titulo="Disponible (kg)">{formatearDecimal(saldo.cantidad_disponible)}</Dato>
        <Dato titulo="Estado">
          <EstadoChip estado={saldo.estado} />
        </Dato>
      </Box>
    </Box>
  )
}
