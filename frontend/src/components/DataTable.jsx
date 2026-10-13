import { useMemo, useState } from 'react'
import {
  Box,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import SearchIcon from '@mui/icons-material/Search'
import { compararValores, normalizarTexto } from '../utils/tabla'
import ErrorAlert from './ErrorAlert'
import LoadingBlock from './LoadingBlock'

const FONDOS = {
  warning: 'warning.light',
  error: 'error.light',
}

function esOrdenable(col) {
  return col.ordenable !== false && col.campo !== 'acciones'
}

function valorDeOrden(col, fila) {
  return col.valorOrden ? col.valorOrden(fila) : fila[col.campo]
}

function textoDeFila(columnas, fila) {
  return columnas
    .flatMap((col) => {
      const valores = [fila[col.campo], col.valorOrden?.(fila)]
      if (col.render) {
        const renderizado = col.render(fila)
        if (typeof renderizado === 'string' || typeof renderizado === 'number') valores.push(renderizado)
      }
      return valores
    })
    .map(normalizarTexto)
    .join(' ')
}

function Vacio({ texto }) {
  return (
    <Paper variant="outlined" sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
      <InboxOutlinedIcon sx={{ fontSize: 40 }} />
      <Typography>{texto}</Typography>
    </Paper>
  )
}

export default function DataTable({ columnas, filas, claveFila, cargando, error, onReintentar, resaltarFila }) {
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState({ campo: null, direccion: 'asc' })

  const visibles = useMemo(() => {
    if (!filas) return []
    const termino = normalizarTexto(busqueda.trim())
    const filtradas = termino ? filas.filter((fila) => textoDeFila(columnas, fila).includes(termino)) : filas
    const col = columnas.find((c) => c.campo === orden.campo)
    if (!col) return filtradas
    const signo = orden.direccion === 'asc' ? 1 : -1
    return [...filtradas].sort((a, b) => signo * compararValores(valorDeOrden(col, a), valorDeOrden(col, b)))
  }, [filas, columnas, busqueda, orden])

  if (cargando) return <LoadingBlock />
  if (error) return <ErrorAlert mensaje={error} onReintentar={onReintentar} />
  if (!filas || filas.length === 0) return <Vacio texto="No hay registros" />

  function cambiarOrden(campo) {
    setOrden((actual) =>
      actual.campo === campo ? { campo, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' } : { campo, direccion: 'asc' },
    )
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
        <TextField
          label="Buscar"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {visibles.length === filas.length ? `${filas.length} registros` : `${visibles.length} de ${filas.length} registros`}
        </Typography>
      </Box>
      {visibles.length === 0 ? (
        <Vacio texto="Ningún registro coincide con la búsqueda" />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {columnas.map((col) => (
                  <TableCell key={col.campo} align={col.alinear} sortDirection={orden.campo === col.campo ? orden.direccion : false}>
                    {esOrdenable(col) ? (
                      <TableSortLabel
                        active={orden.campo === col.campo}
                        direction={orden.campo === col.campo ? orden.direccion : 'asc'}
                        onClick={() => cambiarOrden(col.campo)}
                      >
                        {col.titulo}
                      </TableSortLabel>
                    ) : (
                      col.titulo
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibles.map((fila) => {
                const resalte = resaltarFila?.(fila)
                return (
                  <TableRow
                    key={fila[claveFila]}
                    hover
                    sx={resalte ? { bgcolor: FONDOS[resalte], '& > td:first-of-type': { boxShadow: (t) => `inset 4px 0 0 ${t.palette[resalte].main}` } } : undefined}
                  >
                    {columnas.map((col) => (
                      <TableCell key={col.campo} align={col.alinear}>
                        {col.render ? col.render(fila) : fila[col.campo]}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  )
}
