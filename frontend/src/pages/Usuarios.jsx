import { useState } from 'react'
import { Button, Chip, Typography } from '@mui/material'
import { cambiarEstadoUsuario, listarUsuarios } from '../api/usuarios'
import useCarga from '../api/useCarga'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import Mensaje from '../components/Mensaje'
import UsuarioCrearForm from '../components/UsuarioCrearForm'
import { useAuth } from '../context/useAuth'
import { formatearFechaHora } from '../utils/formato'

export default function Usuarios() {
  const { usuario: actual } = useAuth()
  const { datos, cargando, error, recargar } = useCarga(listarUsuarios)
  const [porCambiar, setPorCambiar] = useState(null)
  const [cambiando, setCambiando] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')
  const [mensaje, setMensaje] = useState('')

  const lideres = (datos || []).filter((u) => u.rol === 'LIDER' && u.activo)

  async function confirmarCambio() {
    setCambiando(true)
    setErrorAccion('')
    try {
      const usuario = await cambiarEstadoUsuario(porCambiar.id, !porCambiar.activo)
      setMensaje(`Usuario ${usuario.nombre} ${usuario.activo ? 'activado' : 'desactivado'}`)
      recargar()
    } catch (err) {
      setErrorAccion(err.message)
    } finally {
      setCambiando(false)
      setPorCambiar(null)
    }
  }

  const columnas = [
    { campo: 'id', titulo: 'ID' },
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'documento', titulo: 'Documento' },
    { campo: 'rol', titulo: 'Rol' },
    { campo: 'lider_id', titulo: 'Líder (ID)', render: (f) => f.lider_id ?? '—' },
    {
      campo: 'activo',
      titulo: 'Estado',
      render: (f) => <Chip size="small" label={f.activo ? 'Activo' : 'Inactivo'} color={f.activo ? 'success' : 'default'} />,
    },
    { campo: 'fecha_creacion', titulo: 'Creación', render: (f) => formatearFechaHora(f.fecha_creacion) },
    {
      campo: 'acciones',
      titulo: 'Acciones',
      render: (f) =>
        f.id === actual.id ? null : (
          <Button size="small" color={f.activo ? 'warning' : 'primary'} onClick={() => setPorCambiar(f)}>
            {f.activo ? 'Desactivar' : 'Activar'}
          </Button>
        ),
    },
  ]

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Usuarios
      </Typography>
      <UsuarioCrearForm
        lideres={lideres}
        onCreado={(usuario) => {
          setMensaje(`Usuario ${usuario.nombre} creado`)
          recargar()
        }}
      />
      <ErrorAlert mensaje={errorAccion} />
      <DataTable columnas={columnas} filas={datos} claveFila="id" cargando={cargando} error={error} onReintentar={recargar} />
      <ConfirmDialog
        abierto={Boolean(porCambiar)}
        titulo={porCambiar?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        mensaje={
          porCambiar
            ? porCambiar.activo
              ? `${porCambiar.nombre} no podrá iniciar sesión mientras esté inactivo.`
              : `${porCambiar.nombre} podrá volver a iniciar sesión.`
            : ''
        }
        textoConfirmar={porCambiar?.activo ? 'Desactivar' : 'Activar'}
        enviando={cambiando}
        onConfirmar={confirmarCambio}
        onCancelar={() => setPorCambiar(null)}
      />
      <Mensaje texto={mensaje} onCerrar={() => setMensaje('')} />
    </>
  )
}
