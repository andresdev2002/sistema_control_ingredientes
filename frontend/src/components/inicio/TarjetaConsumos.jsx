import { Typography } from '@mui/material'
import { formatearDecimal, formatearFechaHora } from '../../utils/formato'
import ListaCorta from './ListaCorta'
import TarjetaIndicador from './TarjetaIndicador'

export default function TarjetaConsumos({ titulo, icono, items, carga, codigosOrden, valor, detalle, textoVacio }) {
  return (
    <TarjetaIndicador
      titulo={titulo}
      icono={icono}
      color="secondary"
      valor={valor}
      detalle={detalle}
      carga={carga}
      vacio={items.length === 0}
      textoVacio={textoVacio}
      enlace={{ ruta: '/consumos', texto: 'Ver consumos' }}
    >
      <ListaCorta
        items={items}
        clave={(c) => c.id}
        primario={(c) => `${c.codigo_sap} · lote ${c.lote_sap}`}
        secundario={(c) => `${formatearFechaHora(c.fecha_hora)} · orden ${codigosOrden[c.orden_produccion_id] ?? `ID ${c.orden_produccion_id}`}`}
        extra={(c) => (
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
            {formatearDecimal(c.peso_redondeado)} kg
          </Typography>
        )}
      />
    </TarjetaIndicador>
  )
}
