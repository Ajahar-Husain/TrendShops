import { Alert, Box, Button, Paper, Skeleton, Typography } from '@mui/material'
import ProductCard from './ProductCard'

export default function ProductGrid({ products = [], loading = false, error, onRetry }) {
  if (loading) {
    return (
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={320} />
        ))}
      </Box>
    )
  }
  if (error) {
    return (
      <Alert
        severity="error"
        action={onRetry && <Button color="inherit" size="small" onClick={() => onRetry()}>Try again</Button>}
      >
        Products are temporarily unavailable. Check your connection and try again.
      </Alert>
    )
  }
  if (products.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
        <Typography color="text.secondary">No products found. Try a different search or category.</Typography>
      </Paper>
    )
  }
  return (
    <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product._id} product={product} animationDelay={Math.min(index * 45, 315)} />
      ))}
    </Box>
  )
}
