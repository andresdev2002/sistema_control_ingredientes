import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Materiales from './pages/Materiales'
import NoEncontrado from './pages/NoEncontrado'
import Recepciones from './pages/Recepciones'
import Saldos from './pages/Saldos'

const ALMACEN = ['LIDER', 'OPERARIO']

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
        <Route path="materiales" element={<ProtectedRoute roles={ALMACEN}><Materiales /></ProtectedRoute>} />
        <Route path="recepciones" element={<ProtectedRoute roles={ALMACEN}><Recepciones /></ProtectedRoute>} />
        <Route path="saldos" element={<ProtectedRoute roles={ALMACEN}><Saldos /></ProtectedRoute>} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  )
}
