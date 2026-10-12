import { useState } from 'react'
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [documento, setDocumento] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to="/" replace />

  const aviso = location.state?.aviso

  async function handleSubmit(evento) {
    evento.preventDefault()
    if (!documento.trim() || !password) {
      setError('Documento y contraseña son obligatorios')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await login(documento.trim(), password)
      navigate(location.state?.desde || '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }} elevation={3}>
        <Typography variant="h5" component="h1" gutterBottom>
          Captura de Ingredientes
        </Typography>
        {aviso && !error && (
          <Alert severity="warning" sx={{ my: 2 }}>
            {aviso}
          </Alert>
        )}
        <ErrorAlert mensaje={error} />
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="documento"
            label="Documento"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            autoFocus
            required
            fullWidth
            margin="normal"
            autoComplete="username"
          />
          <TextField
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
            autoComplete="current-password"
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
