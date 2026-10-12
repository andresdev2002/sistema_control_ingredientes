import { Chip } from '@mui/material'

const COLORES = {
  ACTIVO: 'success',
  AGOTADO: 'default',
  ABIERTA: 'primary',
  CERRADA: 'default',
}

export default function EstadoChip({ estado }) {
  return <Chip label={estado} color={COLORES[estado] || 'default'} size="small" />
}
