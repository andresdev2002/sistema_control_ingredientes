import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import ErrorAlert from './ErrorAlert'
import LoadingBlock from './LoadingBlock'

export default function DataTable({ columnas, filas, claveFila, cargando, error, onReintentar }) {
  if (cargando) return <LoadingBlock />
  if (error) return <ErrorAlert mensaje={error} onReintentar={onReintentar} />
  if (!filas || filas.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 3 }}>
        No hay registros
      </Typography>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {columnas.map((col) => (
              <TableCell key={col.campo} align={col.alinear}>
                {col.titulo}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila[claveFila]} hover>
              {columnas.map((col) => (
                <TableCell key={col.campo} align={col.alinear}>
                  {col.render ? col.render(fila) : fila[col.campo]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
