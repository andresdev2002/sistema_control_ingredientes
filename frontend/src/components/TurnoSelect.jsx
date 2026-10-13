import { MenuItem, TextField } from '@mui/material'

export default function TurnoSelect({ id, label = 'Turno', value, onChange, size = 'small', sx }) {
  return (
    <TextField id={id} select label={label} value={value} onChange={onChange} required size={size} sx={{ minWidth: 120, ...sx }}>
      {['1', '2', '3'].map((t) => (
        <MenuItem key={t} value={t}>
          Turno {t}
        </MenuItem>
      ))}
    </TextField>
  )
}
