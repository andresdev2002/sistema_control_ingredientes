import { useMemo } from 'react'
import DrawIcon from '@mui/icons-material/Draw'
import HistoryIcon from '@mui/icons-material/History'
import TodayIcon from '@mui/icons-material/Today'
import { listarConsumos } from '../../api/consumos'
import { listarFormatos } from '../../api/formatos'
import { listarOrdenes } from '../../api/ordenes'
import { listarRecepciones } from '../../api/recepciones'
import { listarSaldos } from '../../api/saldos'
import useCarga, { combinarCargas } from '../../api/useCarga'
import { fechaLocalHoy } from '../../utils/formato'
import {
  consumosDeHoy,
  formatosConEstado,
  mapaCodigosOrden,
  ordenarRecientes,
  ordenesAbiertas,
  saldosBajos,
  saldosPorVencer,
  sumarDecimales,
  ultimos,
} from '../../utils/indicadores'
import { DIAS_POR_VENCER, SALDO_BAJO_PORCENTAJE } from '../../utils/umbrales'
import AccesosRapidos from './AccesosRapidos'
import GrillaTarjetas from './GrillaTarjetas'
import TarjetaConsumos from './TarjetaConsumos'
import TarjetaFormatos from './TarjetaFormatos'
import TarjetaOrdenesAbiertas from './TarjetaOrdenesAbiertas'
import TarjetaPorVencer from './TarjetaPorVencer'
import TarjetaSaldosBajos from './TarjetaSaldosBajos'

const listarSaldosActivos = () => listarSaldos({ estado: 'ACTIVO' })
const listarTodosLosConsumos = () => listarConsumos()

export default function InicioLider() {
  const saldos = useCarga(listarSaldosActivos)
  const recepciones = useCarga(listarRecepciones)
  const ordenes = useCarga(listarOrdenes)
  const consumos = useCarga(listarTodosLosConsumos)
  const formatos = useCarga(listarFormatos)
  const hoy = fechaLocalHoy()

  const bajos = useMemo(
    () => (saldos.datos && recepciones.datos ? saldosBajos(saldos.datos, recepciones.datos, SALDO_BAJO_PORCENTAJE) : []),
    [saldos.datos, recepciones.datos],
  )
  const porVencer = useMemo(() => saldosPorVencer(saldos.datos || [], hoy, DIAS_POR_VENCER), [saldos.datos, hoy])
  const abiertas = useMemo(() => ordenesAbiertas(ordenes.datos || []), [ordenes.datos])
  const codigosOrden = useMemo(() => mapaCodigosOrden(ordenes.datos), [ordenes.datos])
  const deHoy = useMemo(() => consumosDeHoy(consumos.datos || [], hoy), [consumos.datos, hoy])
  const recientes = useMemo(() => ultimos(consumos.datos || [], 'fecha_hora', 5), [consumos.datos])
  const porFirmar = useMemo(() => formatosConEstado(formatos.datos || [], ['PENDIENTE', 'FIRMADO_LIDER']), [formatos.datos])
  const pendientesLider = porFirmar.filter((f) => f.estado === 'PENDIENTE').length

  return (
    <GrillaTarjetas>
      <TarjetaSaldosBajos items={bajos} carga={combinarCargas(saldos, recepciones)} />
      <TarjetaPorVencer items={porVencer} carga={saldos} />
      <TarjetaOrdenesAbiertas items={abiertas} carga={ordenes} />
      <TarjetaFormatos
        titulo="Formatos por firmar"
        icono={<DrawIcon />}
        color="warning"
        items={porFirmar}
        carga={formatos}
        codigosOrden={codigosOrden}
        valor={porFirmar.length}
        detalle={`${pendientesLider} esperan tu firma · ${porFirmar.length - pendientesLider} esperan a calidad.`}
        textoVacio="No hay formatos por firmar"
      />
      <TarjetaConsumos
        titulo="Consumos de hoy"
        icono={<TodayIcon />}
        items={ordenarRecientes(deHoy, 'fecha_hora')}
        carga={consumos}
        codigosOrden={codigosOrden}
        valor={deHoy.length}
        detalle={`${sumarDecimales(deHoy.map((c) => c.peso_redondeado))} kg redondeados en total.`}
        textoVacio="Sin consumos registrados hoy"
      />
      <TarjetaConsumos
        titulo="Últimos 5 consumos"
        icono={<HistoryIcon />}
        items={recientes}
        carga={consumos}
        codigosOrden={codigosOrden}
        textoVacio="Aún no hay consumos"
      />
      <AccesosRapidos />
    </GrillaTarjetas>
  )
}
