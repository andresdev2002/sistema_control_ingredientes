import { Chip } from '@mui/material'

const COLORES = {
  ACTIVO: 'success',
  AGOTADO: 'default',
  ABIERTA: 'primary',
  CERRADA: 'default',
  PENDIENTE: 'warning',
  FIRMADO_LIDER: 'info',
  COMPLETO: 'success',
}

export default function EstadoChip({ estado }) {
  return <Chip label={estado} color={COLORES[estado] || 'default'} size="small" />
}
