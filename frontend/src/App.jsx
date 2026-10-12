import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Consumos from './pages/Consumos'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Materiales from './pages/Materiales'
import NoEncontrado from './pages/NoEncontrado'
import OrdenDetalle from './pages/OrdenDetalle'
import Ordenes from './pages/Ordenes'
import Recepciones from './pages/Recepciones'
import RegistrarConsumo from './pages/RegistrarConsumo'
import Saldos from './pages/Saldos'

const LIDER_U_OPERARIO = ['LIDER', 'OPERARIO']

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Inicio />} />
        <Route path="materiales" element={<ProtectedRoute roles={LIDER_U_OPERARIO}><Materiales /></ProtectedRoute>} />
        <Route path="recepciones" element={<ProtectedRoute roles={LIDER_U_OPERARIO}><Recepciones /></ProtectedRoute>} />
        <Route path="saldos" element={<ProtectedRoute roles={LIDER_U_OPERARIO}><Saldos /></ProtectedRoute>} />
        <Route path="ordenes" element={<Ordenes />} />
        <Route path="ordenes/:id" element={<OrdenDetalle />} />
        <Route path="consumos" element={<Consumos />} />
        <Route path="consumos/registrar" element={<ProtectedRoute roles={LIDER_U_OPERARIO}><RegistrarConsumo /></ProtectedRoute>} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  )
}
