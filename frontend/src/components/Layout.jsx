import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CategoryIcon from '@mui/icons-material/Category'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import HomeIcon from '@mui/icons-material/Home'
import InventoryIcon from '@mui/icons-material/Inventory'
import ListAltIcon from '@mui/icons-material/ListAlt'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
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
  const esEscritorio = useMediaQuery((theme) => theme.breakpoints.up('md'))
  const [menuAbierto, setMenuAbierto] = useState(false)
  const opciones = MENU.filter((item) => !item.roles || item.roles.includes(rol))

  const menu = (
    <>
      {esEscritorio ? (
        <Toolbar />
      ) : (
        <>
          <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '1rem' }}>
              {usuario.nombre.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {usuario.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {rol}
              </Typography>
            </Box>
          </Box>
          <Divider />
        </>
      )}
      <List component="nav" aria-label="Menú principal" sx={{ px: 1, py: 1 }}>
        {opciones.map((item) => (
          <ListItemButton
            key={item.ruta}
            component={NavLink}
            to={item.ruta}
            end
            onClick={() => setMenuAbierto(false)}
            sx={{
              mb: 0.5,
              '&.active': { bgcolor: 'primary.light', color: 'primary.dark' },
              '&.active .MuiListItemIcon-root': { color: 'primary.main' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icono}</ListItemIcon>
            <ListItemText primary={item.texto} />
          </ListItemButton>
        ))}
      </List>
    </>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          {!esEscritorio && (
            <IconButton color="inherit" edge="start" aria-label="Abrir menú" onClick={() => setMenuAbierto(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} noWrap>
            Captura de Ingredientes
          </Typography>
          {esEscritorio && (
            <Typography variant="body2" noWrap>
              {usuario.nombre} · {rol}
            </Typography>
          )}
          {esEscritorio ? (
            <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
              Cerrar sesión
            </Button>
          ) : (
            <Tooltip title="Cerrar sesión">
              <IconButton color="inherit" aria-label="Cerrar sesión" onClick={logout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant={esEscritorio ? 'permanent' : 'temporary'}
        open={esEscritorio || menuAbierto}
        onClose={() => setMenuAbierto(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: esEscritorio ? ANCHO_MENU : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: ANCHO_MENU, boxSizing: 'border-box' },
        }}
      >
        {menu}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Toolbar />
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
