import { useState } from 'react'
import { Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material'
import { crearUsuario } from '../api/usuarios'
import ErrorAlert from './ErrorAlert'

const VACIO = { nombre: '', documento: '', password: '', rol: '', lider_id: '' }

export default function UsuarioCrearForm({ lideres, onCreado }) {
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })
  const esOperario = form.rol === 'OPERARIO'

  async function handleSubmit(evento) {
    evento.preventDefault()
    const datos = {
      nombre: form.nombre.trim(),
      documento: form.documento.trim(),
      password: form.password,
      rol: form.rol,
    }
    if (!datos.nombre || !datos.documento || !datos.password || !datos.rol) {
      setError('Nombre, documento, contraseña y rol son obligatorios')
      return
    }
    if (esOperario) {
      if (!form.lider_id) {
        setError('Un operario necesita un líder asignado')
        return
      }
      datos.lider_id = Number(form.lider_id)
    }
    setError('')
    setEnviando(true)
    try {
      const usuario = await crearUsuario(datos)
      setForm(VACIO)
      onCreado(usuario)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" component="h2">
        Nuevo usuario
      </Typography>
      <ErrorAlert mensaje={error} />
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
        <TextField id="usr-nombre" label="Nombre" value={form.nombre} onChange={cambiar('nombre')} required autoFocus size="small" />
        <TextField id="usr-documento" label="Documento" value={form.documento} onChange={cambiar('documento')} required size="small" autoComplete="off" />
        <TextField id="usr-password" label="Contraseña" type="password" value={form.password} onChange={cambiar('password')} required size="small" autoComplete="new-password" />
        <TextField id="usr-rol" select label="Rol" value={form.rol} onChange={cambiar('rol')} required size="small" sx={{ minWidth: 150 }}>
          <MenuItem value="LIDER">LIDER</MenuItem>
          <MenuItem value="OPERARIO">OPERARIO</MenuItem>
          <MenuItem value="CALIDAD">CALIDAD</MenuItem>
        </TextField>
        {esOperario && (
          <TextField id="usr-lider" select label="Líder" value={form.lider_id} onChange={cambiar('lider_id')} required size="small" sx={{ minWidth: 200 }}>
            {lideres.map((l) => (
              <MenuItem key={l.id} value={String(l.id)}>
                {l.nombre} (ID {l.id})
              </MenuItem>
            ))}
          </TextField>
        )}
        <Button type="submit" variant="contained" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Crear'}
        </Button>
      </Box>
    </Paper>
  )
}
