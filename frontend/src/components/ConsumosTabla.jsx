import DataTable from './DataTable'
import { formatearDecimal, formatearFecha, formatearFechaHora } from '../utils/formato'

const COLUMNAS = [
  { campo: 'fecha_hora', titulo: 'Fecha', render: (f) => formatearFechaHora(f.fecha_hora) },
  { campo: 'codigo_sap', titulo: 'Código SAP' },
  { campo: 'lote_sap', titulo: 'Lote SAP' },
  { campo: 'lote_proveedor', titulo: 'Lote proveedor' },
  { campo: 'fecha_vencimiento', titulo: 'Vencimiento', render: (f) => formatearFecha(f.fecha_vencimiento) },
  { campo: 'cantidad_disponible_antes', titulo: 'Disponible antes (kg)', alinear: 'right', render: (f) => formatearDecimal(f.cantidad_disponible_antes) },
  { campo: 'peso_capturado', titulo: 'Peso capturado (kg)', alinear: 'right', render: (f) => f.peso_capturado },
  { campo: 'peso_redondeado', titulo: 'Peso redondeado (kg)', alinear: 'right', render: (f) => formatearDecimal(f.peso_redondeado) },
  { campo: 'cantidad_sobrante', titulo: 'Sobrante (kg)', alinear: 'right', render: (f) => formatearDecimal(f.cantidad_sobrante) },
  { campo: 'turno', titulo: 'Turno' },
  { campo: 'usuario_id', titulo: 'Usuario (ID)' },
]

export default function ConsumosTabla({ columnasExtra = [], ...props }) {
  return <DataTable columnas={[...columnasExtra, ...COLUMNAS]} claveFila="id" {...props} />
}
