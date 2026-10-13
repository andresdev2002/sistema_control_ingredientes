import { Box, Typography } from '@mui/material'

export default function PageHeader({ titulo, descripcion, accion }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h1">
          {titulo}
        </Typography>
        {descripcion && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {descripcion}
          </Typography>
        )}
      </Box>
      {accion && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>{accion}</Box>}
    </Box>
  )
}
