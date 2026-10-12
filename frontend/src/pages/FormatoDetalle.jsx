import { useCallback, useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { Link, useParams } from 'react-router-dom'
import { firmarCalidad, firmarLider, obtenerFormato } from '../api/formatos'
import useCarga from '../api/useCarga'
import ConfirmDialog from '../components/ConfirmDialog'
import ErrorAlert from '../components/ErrorAlert'
import EstadoChip from '../components/EstadoChip'
import LoadingBlock from '../components/LoadingBlock'
import Mensaje from '../components/Mensaje'
import { useAuth } from '../context/useAuth'
import { formatearFechaHora } from '../utils/formato'
import Dato from '../components/Dato'

const FIRMAS = {
  lider: {
    titulo: 'Firmar como líder',
    mensaje: 'La firma de líder no se puede deshacer. ¿Confirmas que firmas este formato?',
    accion: firmarLider,
    exito: 'Formato firmado como líder',
  },
  calidad: {
    titulo: 'Firmar calidad',
    mensaje: 'La firma de calidad no se puede deshacer. ¿Confirmas que firmas este formato?',
    accion: firmarCalidad,
    exito: 'Formato firmado por calidad',
  },
}

function Firma({ titulo, firmado, usuarioId, fecha }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 240 }}>
      <Typography variant="subtitle1" component="h2" gutterBottom>
        {titulo}
      </Typography>
      <Dato titulo="Estado">{firmado ? 'Firmado' : 'Sin firmar'}</Dato>
      <Dato titulo="Usuario (ID)">{usuarioId ?? '—'}</Dato>
      <Dato titulo="Fecha de firma">{formatearFechaHora(fecha)}</Dato>
    </Paper>
  )
}

export default function FormatoDetalle() {
  const { id } = useParams()
  const { rol } = useAuth()
  const cargar = useCallback(() => obtenerFormato(id), [id])
  const { datos: formato, cargando, error, recargar } = useCarga(cargar)
  const [firmaPendiente, setFirmaPendiente] = useState(null)
  const [firmando, setFirmando] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function confirmarFirma() {
    const firma = FIRMAS[firmaPendiente]
    setFirmando(true)
    setErrorAccion('')
    try {
      await firma.accion(formato.id)
      setMensaje(firma.exito)
      recargar()
    } catch (err) {
      setErrorAccion(err.message)
    } finally {
      setFirmando(false)
      setFirmaPendiente(null)
    }
  }

  const puedeFirmarLider = formato && rol === 'LIDER' && !formato.firmado_lider
  const puedeFirmarCalidad = formato && rol === 'CALIDAD' && formato.firmado_lider && !formato.firmado_calidad

  return (
    <>
      <Button component={Link} to="/formatos" size="small" sx={{ mb: 1 }}>
        ← Volver a formatos
      </Button>
      {cargando && <LoadingBlock />}
      <ErrorAlert mensaje={error} onReintentar={recargar} />
      {!cargando && formato && (
        <>
          <Typography variant="h5" component="h1" gutterBottom>
            Formato #{formato.id}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2 }}>
              <Dato titulo="Estado">
                <EstadoChip estado={formato.estado} />
              </Dato>
              <Dato titulo="Orden">
                <Button size="small" component={Link} to={`/ordenes/${formato.orden_produccion_id}`} sx={{ p: 0, minWidth: 0 }}>
                  Ver orden (ID {formato.orden_produccion_id})
                </Button>
              </Dato>
              <Dato titulo="Generado por (ID)">{formato.generado_por}</Dato>
              <Dato titulo="Generación">{formatearFechaHora(formato.fecha_generacion)}</Dato>
            </Box>
          </Paper>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Firma titulo="Firma de líder" firmado={formato.firmado_lider} usuarioId={formato.lider_id} fecha={formato.fecha_firma_lider} />
            <Firma titulo="Firma de calidad" firmado={formato.firmado_calidad} usuarioId={formato.calidad_id} fecha={formato.fecha_firma_calidad} />
          </Box>
          <ErrorAlert mensaje={errorAccion} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            {puedeFirmarLider && (
              <Button variant="contained" onClick={() => setFirmaPendiente('lider')}>
                Firmar como líder
              </Button>
            )}
            {puedeFirmarCalidad && (
              <Button variant="contained" onClick={() => setFirmaPendiente('calidad')}>
                Firmar calidad
              </Button>
            )}
          </Box>
        </>
      )}
      <ConfirmDialog
        abierto={Boolean(firmaPendiente)}
        titulo={firmaPendiente ? FIRMAS[firmaPendiente].titulo : ''}
        mensaje={firmaPendiente ? FIRMAS[firmaPendiente].mensaje : ''}
        textoConfirmar="Firmar"
        enviando={firmando}
        onConfirmar={confirmarFirma}
        onCancelar={() => setFirmaPendiente(null)}
      />
      <Mensaje texto={mensaje} onCerrar={() => setMensaje('')} />
    </>
  )
}
