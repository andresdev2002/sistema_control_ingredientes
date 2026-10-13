import { Box, LinearProgress, Typography } from '@mui/material'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import { formatearDecimal } from '../../utils/formato'
import { SALDO_BAJO_PORCENTAJE } from '../../utils/umbrales'
import ListaCorta from './ListaCorta'
import TarjetaIndicador from './TarjetaIndicador'

export default function TarjetaSaldosBajos({ items, carga }) {
  return (
    <TarjetaIndicador
      titulo="Saldos bajos"
      icono={<TrendingDownIcon />}
      color="warning"
      valor={items.length}
      detalle={`Bultos activos con ${SALDO_BAJO_PORCENTAJE}% o menos de lo recibido.`}
      carga={carga}
      vacio={items.length === 0}
      textoVacio="Ningún bulto por debajo del umbral"
      enlace={{ ruta: '/saldos', texto: 'Ver saldos' }}
    >
      <ListaCorta
        items={items}
        clave={(i) => i.saldo.id}
        primario={(i) => `${i.saldo.codigo_sap} · ${i.saldo.codigo_barras}`}
        secundario={(i) => (
          <Box>
            <LinearProgress variant="determinate" color="warning" value={i.porcentaje} sx={{ height: 8, borderRadius: 4, my: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              {formatearDecimal(i.saldo.cantidad_disponible)} de {formatearDecimal(i.recibida)} kg ({i.porcentaje}%)
            </Typography>
          </Box>
        )}
      />
    </TarjetaIndicador>
  )
}
