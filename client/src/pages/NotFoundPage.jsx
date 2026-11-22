import { Box, Button, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Box className="container-app" sx={{ py: { xs: 8, sm: 12 }, textAlign: 'center' }}>
      <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing=".12em">404 · Page not found</Typography>
      <Typography component="h1" variant="h3" fontWeight={800} sx={{ mt: 1.5, fontSize: { xs: '2rem', sm: '3rem' } }}>This page took a wrong turn.</Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5 }}>We couldn’t find that page. It may have moved or the link may be incorrect.</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center', mt: 3 }}>
        <Button component={Link} to="/" variant="contained">Back to TrendShops</Button>
        <Button component={Link} to="/shop" variant="outlined">Browse products</Button>
      </Stack>
    </Box>
  )
}
