import { Box } from '@mui/material'

export default function GrillaTarjetas({ children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 2, alignItems: 'start' }}>
      {children}
    </Box>
  )
}
