import EstadoChip from '../EstadoChip'
import { formatearFechaHora } from '../../utils/formato'
import ListaCorta from './ListaCorta'
import TarjetaIndicador from './TarjetaIndicador'

export default function TarjetaFormatos({ titulo, icono, color, items, carga, codigosOrden, campoFecha = 'fecha_generacion', textoFecha = 'Generado', valor, detalle, textoVacio, destacada }) {
  return (
    <TarjetaIndicador
      titulo={titulo}
      icono={icono}
      color={color}
      valor={valor}
      detalle={detalle}
      carga={carga}
      vacio={items.length === 0}
      textoVacio={textoVacio}
      destacada={destacada}
      enlace={{ ruta: '/formatos', texto: 'Ver formatos' }}
    >
      <ListaCorta
        items={items}
        clave={(f) => f.id}
        ruta={(f) => `/formatos/${f.id}`}
        primario={(f) => `Formato #${f.id} · orden ${codigosOrden[f.orden_produccion_id] ?? `ID ${f.orden_produccion_id}`}`}
        secundario={(f) => `${textoFecha} ${formatearFechaHora(f[campoFecha])}`}
        extra={(f) => <EstadoChip estado={f.estado} />}
      />
    </TarjetaIndicador>
  )
}
