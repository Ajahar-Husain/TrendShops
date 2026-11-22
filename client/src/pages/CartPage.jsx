import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import { useCart } from '../hooks/useCart'
import { useAuthStore } from '../store/authStore'
import { formatPrice } from '../utils/formatters'

export default function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, subtotal, shipping, tax, total, updateQty, removeItem } = useCart()

  if (!items.length) {
    return (
      <Box className="container-app py-20">
        <Paper variant="outlined" sx={{ maxWidth: 520, mx: 'auto', p: 5, textAlign: 'center', borderRadius: 4 }}>
          <ShoppingBagOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography component="h1" variant="h5" fontWeight={800} sx={{ mt: 2 }}>Your cart is waiting</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Add a few favourites and they’ll show up here.</Typography>
          <Button component={Link} to="/shop" variant="contained" sx={{ mt: 3 }}>Explore products</Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box className="container-app py-8 sm:py-12">
      <Typography variant="overline" color="primary.main" fontWeight={700}>Almost yours</Typography>
      <Typography component="h1" variant="h4" fontWeight={800}>Shopping cart</Typography>
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: 'minmax(0, 1fr) 360px' }, mt: 3 }}>
        <Stack spacing={1.5}>
          {items.map(({ product, qty }) => {
            const image = product.images?.find((item) => item.isPrimary)?.url || product.images?.[0]?.url
            return (
              <Paper key={product._id} variant="outlined" sx={{ display: 'flex', gap: 2, p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
                <Link to={`/product/${product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-32 sm:w-32">
                  {image && <img className="h-full w-full object-cover" src={image} alt={product.name} />}
                </Link>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ minWidth: 0, flex: 1, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" color="primary.main" fontWeight={700}>{product.brand}</Typography>
                    <Typography component={Link} to={`/product/${product.slug}`} color="text.primary" fontWeight={700} sx={{ display: 'block', textDecoration: 'none' }}>
                      {product.name}
                    </Typography>
                    <Typography fontWeight={700} sx={{ mt: 1 }}>{formatPrice(product.price)}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Select
                      size="small"
                      value={qty}
                      aria-label={`Quantity for ${product.name}`}
                      onChange={(event) => updateQty(product._id, Number(event.target.value))}
                      sx={{ minWidth: 76 }}
                    >
                      {Array.from({ length: Math.max(5, qty) }, (_, index) => <MenuItem key={index + 1} value={index + 1}>{index + 1}</MenuItem>)}
                    </Select>
                    <IconButton aria-label={`Remove ${product.name}`} color="error" onClick={() => removeItem(product._id)}>
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            )
          })}
        </Stack>

        <Paper component="aside" variant="outlined" sx={{ height: 'fit-content', p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800}>Order summary</Typography>
          <Stack spacing={1.5} sx={{ mt: 2.5 }}>
            <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
            <SummaryRow label="Delivery" value={shipping === 0 ? 'Free' : formatPrice(shipping)} />
            <SummaryRow label="Estimated tax" value={formatPrice(tax)} />
            <Divider />
            <SummaryRow label="Total" value={formatPrice(total)} strong />
          </Stack>
          <Button fullWidth variant="contained" size="large" sx={{ mt: 2.5 }} onClick={() => navigate(user ? '/checkout' : '/login?redirect=/checkout')}>
            Continue to checkout
          </Button>
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1.5 }}>Secure checkout · UPI / QR payment only</Typography>
          <Button component={Link} to="/shop" fullWidth variant="text" sx={{ mt: 1 }}>Continue shopping</Button>
        </Paper>
      </Box>
    </Box>
  )
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant={strong ? 'subtitle1' : 'body2'} color={strong ? 'text.primary' : 'text.secondary'} fontWeight={strong ? 800 : 400}>{label}</Typography>
      <Typography variant={strong ? 'subtitle1' : 'body2'} fontWeight={strong ? 800 : 600}>{value}</Typography>
    </Stack>
  )
}
