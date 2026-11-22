import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CardMedia,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Rating,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import { useProduct } from '../hooks/useProducts'
import { useCartStore } from '../store/cartStore'
import { formatPrice } from '../utils/formatters'
import WishlistButton from '../components/product/WishlistButton'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const query = useProduct(slug)
  const addItem = useCartStore((state) => state.addItem)
  const [qty, setQty] = useState(1)

  if (query.isLoading) return <Box className="container-app py-16"><Typography color="text.secondary">Loading product…</Typography></Box>
  if (query.isError || !query.data?.product) {
    const notFound = query.error?.response?.status === 404 || (!query.isError && !query.data?.product)
    return (
      <Box className="container-app py-16">
        <Alert
          severity={notFound ? 'warning' : 'error'}
          action={!notFound && <Button color="inherit" size="small" onClick={() => query.refetch()}>Try again</Button>}
        >
          <Typography variant="h6">{notFound ? 'This product is no longer available' : 'We could not load this product'}</Typography>
          {notFound ? 'It may have been removed or the link may be incorrect.' : 'Check your connection and try again.'}
          <Button component={Link} to="/shop" sx={{ ml: 1 }}>Browse products</Button>
        </Alert>
      </Box>
    )
  }

  const product = query.data.product
  const image = product.images?.find((item) => item.isPrimary)?.url || product.images?.[0]?.url

  return (
    <Box className="container-app py-8">
      <Breadcrumbs sx={{ mb: 3, fontSize: 13 }}>
        <Link to="/">Home</Link>
        <Link to="/shop">Shop</Link>
        <Typography color="text.primary" variant="body2">{product.name}</Typography>
      </Breadcrumbs>
      <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { lg: '1fr 1fr' } }}>
        <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 4, bgcolor: 'grey.100' }}>
          {image ? (
            <CardMedia component="img" image={image} alt={product.name} sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
              <AddShoppingCartOutlinedIcon sx={{ fontSize: 64 }} />
            </Box>
          )}
        </Paper>
        <Paper variant="outlined" sx={{ borderRadius: 4, p: { xs: 3, sm: 4 } }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="overline" color="primary.main" fontWeight={700}>{product.brand || 'TrendShops collection'}</Typography>
            <WishlistButton product={product} />
          </Stack>
          <Typography component="h1" variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{product.name}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
            <Rating value={Number(product.rating || 0)} precision={0.1} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">{product.numReviews || 0} customer reviews</Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline', mt: 3 }}>
            <Typography variant="h4" fontWeight={800}>{formatPrice(product.price)}</Typography>
            {product.originalPrice > product.price && (
              <>
                <Typography color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)}</Typography>
                <Typography color="primary.main" fontWeight={700}>{product.discountPercent}% off</Typography>
              </>
            )}
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 3, pt: 2.5, borderTop: 1, borderColor: 'divider', lineHeight: 1.8 }}>
            {product.description}
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><CheckCircleOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2">Quality checked and ready to ship</Typography></Stack>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><LocalShippingOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2">Free delivery on orders over ₹499</Typography></Stack>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><SupportAgentOutlinedIcon color="primary" fontSize="small" /><Typography variant="body2">Customer support for your order</Typography></Stack>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="product-quantity-label">Quantity</InputLabel>
              <Select labelId="product-quantity-label" label="Quantity" value={qty} onChange={(event) => setQty(Number(event.target.value))}>
                {Array.from({ length: Math.min(5, product.stock) }, (_, index) => <MenuItem key={index + 1} value={index + 1}>{index + 1}</MenuItem>)}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<AddShoppingCartOutlinedIcon />}
              disabled={product.stock < 1}
              onClick={() => addItem(product, qty)}
            >
              {product.stock ? 'Add to cart' : 'Out of stock'}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'} · UPI / QR payment
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
