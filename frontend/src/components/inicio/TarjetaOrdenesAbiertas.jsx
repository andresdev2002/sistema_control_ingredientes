import { Button } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ScaleIcon from '@mui/icons-material/Scale'
import { Link } from 'react-router-dom'
import { formatearFechaHora } from '../../utils/formato'
import ListaCorta from './ListaCorta'
import TarjetaIndicador from './TarjetaIndicador'

export default function TarjetaOrdenesAbiertas({ items, carga, conRegistrar }) {
  return (
    <TarjetaIndicador
      titulo="Órdenes abiertas"
      icono={<AssignmentIcon />}
      valor={items.length}
      carga={carga}
      vacio={items.length === 0}
      textoVacio="No hay órdenes abiertas"
      enlace={{ ruta: '/ordenes', texto: 'Ver órdenes' }}
    >
      <ListaCorta
        items={items}
        clave={(o) => o.id}
        ruta={(o) => `/ordenes/${o.id}`}
        primario={(o) => `${o.codigo_orden}${o.codigo_producto_terminado ? ` · ${o.codigo_producto_terminado}` : ''}`}
        secundario={(o) => `Turno ${o.turno_apertura} · abierta ${formatearFechaHora(o.fecha_apertura)}`}
      />
      {conRegistrar && items.length > 0 && (
        <Button component={Link} to="/consumos/registrar" variant="contained" startIcon={<ScaleIcon />} fullWidth sx={{ mt: 2 }} size="large">
          Registrar consumo
        </Button>
      )}
    </TarjetaIndicador>
  )
}
