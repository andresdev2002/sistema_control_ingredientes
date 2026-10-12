import { MenuItem, TextField } from '@mui/material'

export default function TurnoSelect({ id, label = 'Turno', value, onChange }) {
  return (
    <TextField id={id} select label={label} value={value} onChange={onChange} required size="small" sx={{ minWidth: 120 }}>
      {['1', '2', '3'].map((t) => (
        <MenuItem key={t} value={t}>
          Turno {t}
        </MenuItem>
      ))}
    </TextField>
  )
}
