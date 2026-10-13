import { useCallback, useEffect, useState } from 'react'

export default function useCarga(cargar) {
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState({ cargar: null, version: -1, datos: null, error: '' })

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let activo = true
    cargar()
      .then((datos) => {
        if (activo) setResultado({ cargar, version, datos, error: '' })
      })
      .catch((err) => {
        if (activo) setResultado({ cargar, version, datos: null, error: err.message })
      })
    return () => {
      activo = false
    }
  }, [cargar, version])

  const cargando = resultado.cargar !== cargar || resultado.version !== version
  return { datos: resultado.datos, cargando, error: cargando ? '' : resultado.error, recargar }
}

export function combinarCargas(...cargas) {
  const cargando = cargas.some((c) => c.cargando)
  const conError = cargas.filter((c) => c.error)
  return {
    cargando,
    error: conError[0]?.error || '',
    recargar: () => conError.forEach((c) => c.recargar()),
  }
}
