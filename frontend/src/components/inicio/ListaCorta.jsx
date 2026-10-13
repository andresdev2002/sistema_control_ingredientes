import { List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

const MAXIMO = 5

export default function ListaCorta({ items, clave, primario, secundario, extra, ruta, maximo = MAXIMO }) {
  const visibles = items.slice(0, maximo)
  const restantes = items.length - visibles.length
  return (
    <>
      <List dense disablePadding>
        {visibles.map((item) => {
          const contenido = (
            <>
              <ListItemText primary={primario(item)} secondary={secundario?.(item)} slotProps={{ secondary: { component: 'div' } }} />
              {extra?.(item)}
            </>
          )
          return ruta ? (
            <ListItemButton key={clave(item)} component={Link} to={ruta(item)} sx={{ px: 1, gap: 1 }}>
              {contenido}
            </ListItemButton>
          ) : (
            <ListItem key={clave(item)} sx={{ px: 1, gap: 1 }}>
              {contenido}
            </ListItem>
          )
        })}
      </List>
      {restantes > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          y {restantes} más
        </Typography>
      )}
    </>
  )
}
