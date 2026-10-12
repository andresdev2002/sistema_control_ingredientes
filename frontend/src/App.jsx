import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import NoEncontrado from './pages/NoEncontrado'

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
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  )
}
