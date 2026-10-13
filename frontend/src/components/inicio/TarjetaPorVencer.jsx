import { Chip } from '@mui/material'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import { formatearDecimal, formatearFecha } from '../../utils/formato'
import { DIAS_POR_VENCER } from '../../utils/umbrales'
import ListaCorta from './ListaCorta'
import TarjetaIndicador from './TarjetaIndicador'

function textoDias(item) {
  if (item.clase === 'VENCIDO') return 'Vencido'
  if (item.dias === 0) return 'Vence hoy'
  return `${item.dias} ${item.dias === 1 ? 'día' : 'días'}`
}

export default function TarjetaPorVencer({ items, carga }) {
  const vencidos = items.filter((i) => i.clase === 'VENCIDO').length
  return (
    <TarjetaIndicador
      titulo="Por vencer o vencidos"
      icono={<EventBusyIcon />}
      color="error"
      valor={items.length}
      detalle={`${vencidos} vencidos · ventana de ${DIAS_POR_VENCER} días.`}
      carga={carga}
      vacio={items.length === 0}
      textoVacio="Ningún bulto activo vence pronto"
      enlace={{ ruta: '/saldos', texto: 'Ver saldos' }}
    >
      <ListaCorta
        items={items}
        clave={(i) => i.saldo.id}
        primario={(i) => `${i.saldo.codigo_sap} · lote ${i.saldo.lote_sap}`}
        secundario={(i) => `Vence ${formatearFecha(i.saldo.fecha_vencimiento)} · ${formatearDecimal(i.saldo.cantidad_disponible)} kg`}
        extra={(i) => <Chip size="small" label={textoDias(i)} color={i.clase === 'VENCIDO' ? 'error' : 'warning'} />}
      />
    </TarjetaIndicador>
  )
}
