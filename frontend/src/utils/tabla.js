const DECIMAL = /^-?\d+(\.\d+)?$/

export function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function compararDecimales(a, b) {
  const [enteroA, fraccionA = ''] = a.split('.')
  const [enteroB, fraccionB = ''] = b.split('.')
  const diferencia = BigInt(enteroA) - BigInt(enteroB)
  if (diferencia !== 0n) return diferencia > 0n ? 1 : -1
  const largo = Math.max(fraccionA.length, fraccionB.length)
  return fraccionA.padEnd(largo, '0').localeCompare(fraccionB.padEnd(largo, '0'))
}

export function compararValores(a, b) {
  const vacioA = a === null || a === undefined || a === ''
  const vacioB = b === null || b === undefined || b === ''
  if (vacioA || vacioB) return vacioA === vacioB ? 0 : vacioA ? 1 : -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  const textoA = String(a)
  const textoB = String(b)
  if (DECIMAL.test(textoA) && DECIMAL.test(textoB) && !textoA.startsWith('-') && !textoB.startsWith('-')) {
    return compararDecimales(textoA, textoB)
  }
  return textoA.localeCompare(textoB, 'es', { numeric: true, sensitivity: 'base' })
}
