const MS_POR_DIA = 86400000

export function aCentesimas(valor) {
  const coincidencia = /^(\d+)(?:\.(\d*))?$/.exec(String(valor ?? '').trim())
  if (!coincidencia) return null
  const decimales = (coincidencia[2] || '').padEnd(2, '0').slice(0, 2)
  return Number(coincidencia[1]) * 100 + Number(decimales)
}

export function centesimasATexto(centesimas) {
  const entero = Math.floor(centesimas / 100)
  const resto = String(centesimas % 100).padStart(2, '0')
  return `${entero}.${resto}`
}

export function sumarDecimales(valores) {
  return centesimasATexto(valores.reduce((total, v) => total + (aCentesimas(v) ?? 0), 0))
}

function partesFecha(fechaIso) {
  const [anio, mes, dia] = fechaIso.slice(0, 10).split('-').map(Number)
  return Date.UTC(anio, mes - 1, dia)
}

export function sumarDias(fechaIso, dias) {
  return new Date(partesFecha(fechaIso) + dias * MS_POR_DIA).toISOString().slice(0, 10)
}

export function diasEntre(desdeIso, hastaIso) {
  return Math.round((partesFecha(hastaIso) - partesFecha(desdeIso)) / MS_POR_DIA)
}

export function porcentajeDisponible(disponible, recibida) {
  const d = aCentesimas(disponible)
  const r = aCentesimas(recibida)
  if (d === null || !r) return null
  return Math.min(100, Math.floor((d * 100) / r))
}

export function esSaldoBajo(disponible, recibida, umbral) {
  const d = aCentesimas(disponible)
  const r = aCentesimas(recibida)
  if (d === null || !r) return false
  return d * 100 <= r * umbral
}

export function saldosBajos(saldos, recepciones, umbral) {
  const porId = new Map(recepciones.map((r) => [r.id, r]))
  return saldos
    .filter((s) => s.estado === 'ACTIVO' && s.origen_recepcion_id != null)
    .map((s) => ({ saldo: s, recepcion: porId.get(s.origen_recepcion_id) }))
    .filter(({ saldo, recepcion }) => recepcion && esSaldoBajo(saldo.cantidad_disponible, recepcion.cantidad_recibida, umbral))
    .map(({ saldo, recepcion }) => ({
      saldo,
      recibida: recepcion.cantidad_recibida,
      porcentaje: porcentajeDisponible(saldo.cantidad_disponible, recepcion.cantidad_recibida),
    }))
    .sort((a, b) => a.porcentaje - b.porcentaje || a.saldo.id - b.saldo.id)
}

export function clasificarVencimiento(fechaVencimiento, hoy, dias) {
  if (!fechaVencimiento) return null
  const fecha = fechaVencimiento.slice(0, 10)
  if (fecha < hoy) return 'VENCIDO'
  if (fecha <= sumarDias(hoy, dias)) return 'POR_VENCER'
  return null
}

export function saldosPorVencer(saldos, hoy, dias) {
  return saldos
    .filter((s) => s.estado === 'ACTIVO')
    .map((s) => ({
      saldo: s,
      clase: clasificarVencimiento(s.fecha_vencimiento, hoy, dias),
      dias: diasEntre(hoy, s.fecha_vencimiento),
    }))
    .filter((item) => item.clase)
    .sort((a, b) => a.saldo.fecha_vencimiento.localeCompare(b.saldo.fecha_vencimiento) || a.saldo.id - b.saldo.id)
}

export function ordenarRecientes(lista, campoFecha) {
  return [...lista].sort((a, b) => String(b[campoFecha] ?? '').localeCompare(String(a[campoFecha] ?? '')) || b.id - a.id)
}

export function ultimos(lista, campoFecha, cantidad) {
  return ordenarRecientes(lista, campoFecha).slice(0, cantidad)
}

export function consumosDeHoy(consumos, hoy) {
  return consumos.filter((c) => String(c.fecha_hora ?? '').slice(0, 10) === hoy)
}

export function ordenesAbiertas(ordenes) {
  return ordenarRecientes(ordenes.filter((o) => o.estado === 'ABIERTA'), 'fecha_apertura')
}

export function formatosConEstado(formatos, estados) {
  return ordenarRecientes(formatos.filter((f) => estados.includes(f.estado)), 'fecha_generacion')
}

export function mapaCodigosOrden(ordenes) {
  return Object.fromEntries((ordenes || []).map((o) => [o.id, o.codigo_orden]))
}
