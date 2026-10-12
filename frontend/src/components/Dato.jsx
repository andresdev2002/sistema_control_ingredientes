import { Box, Typography } from '@mui/material'

export default function Dato({ titulo, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {titulo}
      </Typography>
      <Typography component="div">{children}</Typography>
    </Box>
  )
}
