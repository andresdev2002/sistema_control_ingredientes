export function formatearDecimal(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const texto = String(valor)
  const [entero, decimales = ''] = texto.split('.')
  if (/^-?\d+$/.test(entero) && /^\d*$/.test(decimales) && decimales.length <= 2) {
    return `${entero}.${decimales.padEnd(2, '0')}`
  }
  return Number(texto).toFixed(2)
}

export function formatearFecha(valor) {
  if (!valor) return '—'
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

export function formatearFechaHora(valor) {
  if (!valor) return '—'
  const [fecha, hora = ''] = String(valor).split('T')
  return `${formatearFecha(fecha)} ${hora.slice(0, 5)}`.trim()
}

export function normalizarDecimal(valor) {
  return String(valor).trim().replace(',', '.')
}

export function esNumeroPositivo(valor) {
  return /^\d+(\.\d+)?$/.test(valor) && /[1-9]/.test(valor)
}

export function esFechaValida(valor) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor || '')
  if (!partes) return false
  const [anio, mes, dia] = partes.slice(1).map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
}
