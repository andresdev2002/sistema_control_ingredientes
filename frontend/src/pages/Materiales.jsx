import { useState } from 'react'
import { Button, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { listarMateriales } from '../api/materiales'
import useCarga from '../api/useCarga'
import DataTable from '../components/DataTable'
import MaterialCrearForm from '../components/MaterialCrearForm'
import MaterialEditarDialog from '../components/MaterialEditarDialog'
import Mensaje from '../components/Mensaje'
import { useAuth } from '../context/useAuth'

export default function Materiales() {
  const { rol } = useAuth()
  const esLider = rol === 'LIDER'
  const { datos, cargando, error, recargar } = useCarga(listarMateriales)
  const [editando, setEditando] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const columnas = [
    { campo: 'codigo_sap', titulo: 'Código SAP' },
    { campo: 'descripcion', titulo: 'Descripción' },
    { campo: 'unidad_medida', titulo: 'Unidad' },
  ]
  if (esLider) {
    columnas.push({
      campo: 'acciones',
      titulo: 'Acciones',
      render: (fila) => (
        <Button size="small" startIcon={<EditIcon />} onClick={() => setEditando(fila)}>
          Editar
        </Button>
      ),
    })
  }

  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        Materiales
      </Typography>
      {esLider && (
        <MaterialCrearForm
          onCreado={(material) => {
            setMensaje(`Material ${material.codigo_sap} creado`)
            recargar()
          }}
        />
      )}
      <DataTable columnas={columnas} filas={datos} claveFila="codigo_sap" cargando={cargando} error={error} onReintentar={recargar} />
      {editando && (
        <MaterialEditarDialog
          material={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={(material) => {
            setEditando(null)
            setMensaje(`Material ${material.codigo_sap} actualizado`)
            recargar()
          }}
        />
      )}
      <Mensaje texto={mensaje} onCerrar={() => setMensaje('')} />
    </>
  )
}
