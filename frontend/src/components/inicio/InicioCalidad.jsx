import { useMemo } from 'react'
import DrawIcon from '@mui/icons-material/Draw'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import { listarFormatos } from '../../api/formatos'
import { listarOrdenes } from '../../api/ordenes'
import useCarga from '../../api/useCarga'
import { formatosConEstado, mapaCodigosOrden, ultimos } from '../../utils/indicadores'
import GrillaTarjetas from './GrillaTarjetas'
import TarjetaFormatos from './TarjetaFormatos'

export default function InicioCalidad() {
  const formatos = useCarga(listarFormatos)
  const ordenes = useCarga(listarOrdenes)

  const codigosOrden = useMemo(() => mapaCodigosOrden(ordenes.datos), [ordenes.datos])
  const esperando = useMemo(() => formatosConEstado(formatos.datos || [], ['FIRMADO_LIDER']), [formatos.datos])
  const completos = useMemo(
    () => ultimos((formatos.datos || []).filter((f) => f.estado === 'COMPLETO'), 'fecha_firma_calidad', 5),
    [formatos.datos],
  )

  return (
    <GrillaTarjetas>
      <TarjetaFormatos
        titulo="Esperando tu firma"
        icono={<DrawIcon />}
        color="warning"
        items={esperando}
        carga={formatos}
        codigosOrden={codigosOrden}
        campoFecha="fecha_firma_lider"
        textoFecha="Firmado por líder"
        valor={esperando.length}
        detalle="Formatos con firma de líder y sin firma de calidad."
        textoVacio="No hay formatos esperando tu firma"
        destacada={esperando.length > 0}
      />
      <TarjetaFormatos
        titulo="Últimos formatos completos"
        icono={<TaskAltIcon />}
        color="success"
        items={completos}
        carga={formatos}
        codigosOrden={codigosOrden}
        campoFecha="fecha_firma_calidad"
        textoFecha="Firmado por calidad"
        textoVacio="Aún no hay formatos completos"
      />
    </GrillaTarjetas>
  )
}
