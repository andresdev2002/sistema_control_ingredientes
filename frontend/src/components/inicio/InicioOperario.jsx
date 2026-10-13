import { useMemo } from 'react'
import HistoryIcon from '@mui/icons-material/History'
import { listarConsumos } from '../../api/consumos'
import { listarOrdenes } from '../../api/ordenes'
import { listarRecepciones } from '../../api/recepciones'
import { listarSaldos } from '../../api/saldos'
import useCarga, { combinarCargas } from '../../api/useCarga'
import { useAuth } from '../../context/useAuth'
import { mapaCodigosOrden, ordenesAbiertas, saldosBajos, ultimos } from '../../utils/indicadores'
import { SALDO_BAJO_PORCENTAJE } from '../../utils/umbrales'
import GrillaTarjetas from './GrillaTarjetas'
import TarjetaConsumos from './TarjetaConsumos'
import TarjetaOrdenesAbiertas from './TarjetaOrdenesAbiertas'
import TarjetaSaldosBajos from './TarjetaSaldosBajos'

const listarSaldosActivos = () => listarSaldos({ estado: 'ACTIVO' })
const listarTodosLosConsumos = () => listarConsumos()

export default function InicioOperario() {
  const { usuario } = useAuth()
  const saldos = useCarga(listarSaldosActivos)
  const recepciones = useCarga(listarRecepciones)
  const ordenes = useCarga(listarOrdenes)
  const consumos = useCarga(listarTodosLosConsumos)

  const bajos = useMemo(
    () => (saldos.datos && recepciones.datos ? saldosBajos(saldos.datos, recepciones.datos, SALDO_BAJO_PORCENTAJE) : []),
    [saldos.datos, recepciones.datos],
  )
  const abiertas = useMemo(() => ordenesAbiertas(ordenes.datos || []), [ordenes.datos])
  const codigosOrden = useMemo(() => mapaCodigosOrden(ordenes.datos), [ordenes.datos])
  const mios = useMemo(
    () => ultimos((consumos.datos || []).filter((c) => c.usuario_id === usuario.id), 'fecha_hora', 5),
    [consumos.datos, usuario.id],
  )

  return (
    <GrillaTarjetas>
      <TarjetaOrdenesAbiertas items={abiertas} carga={ordenes} conRegistrar />
      <TarjetaSaldosBajos items={bajos} carga={combinarCargas(saldos, recepciones)} />
      <TarjetaConsumos
        titulo="Mis últimos consumos"
        icono={<HistoryIcon />}
        items={mios}
        carga={consumos}
        codigosOrden={codigosOrden}
        textoVacio="Aún no has registrado consumos"
      />
    </GrillaTarjetas>
  )
}
