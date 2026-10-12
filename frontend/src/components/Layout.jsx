import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CategoryIcon from '@mui/icons-material/Category'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import HomeIcon from '@mui/icons-material/Home'
import InventoryIcon from '@mui/icons-material/Inventory'
import ListAltIcon from '@mui/icons-material/ListAlt'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import LogoutIcon from '@mui/icons-material/Logout'
import PeopleIcon from '@mui/icons-material/People'
import ScaleIcon from '@mui/icons-material/Scale'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const ANCHO_MENU = 230

const MENU = [
  { ruta: '/', texto: 'Inicio', icono: <HomeIcon />, roles: null },
  { ruta: '/consumos/registrar', texto: 'Registrar consumo', icono: <ScaleIcon />, roles: ['LIDER', 'OPERARIO'] },
  { ruta: '/ordenes', texto: 'Órdenes', icono: <AssignmentIcon />, roles: null },
  { ruta: '/consumos', texto: 'Consumos', icono: <ListAltIcon />, roles: null },
  { ruta: '/formatos', texto: 'Formatos', icono: <FactCheckIcon />, roles: null },
  { ruta: '/materiales', texto: 'Materiales', icono: <CategoryIcon />, roles: ['LIDER', 'OPERARIO'] },
  { ruta: '/recepciones', texto: 'Recepciones', icono: <LocalShippingIcon />, roles: ['LIDER', 'OPERARIO'] },
  { ruta: '/saldos', texto: 'Saldos', icono: <InventoryIcon />, roles: ['LIDER', 'OPERARIO'] },
  { ruta: '/usuarios', texto: 'Usuarios', icono: <PeopleIcon />, roles: ['LIDER'] },
]

export default function Layout() {
  const { usuario, rol, logout } = useAuth()
  const opciones = MENU.filter((item) => !item.roles || item.roles.includes(rol))

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} noWrap>
            Captura de Ingredientes
          </Typography>
          <Typography variant="body2" noWrap>
            {usuario.nombre} · {rol}
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: ANCHO_MENU,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: ANCHO_MENU, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List component="nav" aria-label="Menú principal">
          {opciones.map((item) => (
            <ListItemButton key={item.ruta} component={NavLink} to={item.ruta} end>
              <ListItemIcon>{item.icono}</ListItemIcon>
              <ListItemText primary={item.texto} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
