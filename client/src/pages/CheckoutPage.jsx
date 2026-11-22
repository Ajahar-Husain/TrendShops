import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Radio,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import axiosInstance from '../api/axios'
import { useCart } from '../hooks/useCart'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { formatPrice } from '../utils/formatters'
import OpenFreeMapAddressPicker from '../components/address/GoogleAddressPicker'

const initialAddress = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' }
const addressFields = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', pattern: '[6-9][0-9]{9}' },
  { name: 'line1', label: 'Flat, house no. and street', gridColumn: '1 / -1' },
  { name: 'line2', label: 'Landmark (optional)', required: false },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'PIN code', inputProps: { minLength: 6, maxLength: 6, pattern: '[0-9]{6}' } },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { items, subtotal, shipping, tax, total } = useCart()
  const clearCart = useCartStore((state) => state.clearCart)
  const [address, setAddress] = useState({ ...initialAddress, fullName: user?.name || '', phone: user?.phone || '' })
  const [submitting, setSubmitting] = useState(false)

  async function placeOrder(event) {
    event.preventDefault()
    if (!items.length) {
      toast.error('Your cart is empty.')
      return
    }
    setSubmitting(true)
    try {
      await axiosInstance.delete('/api/cart/clear')
      for (const item of items) {
        await axiosInstance.post('/api/cart/add', { productId: item.product._id, qty: item.qty })
      }
      const { data } = await axiosInstance.post('/api/orders', { shippingAddress: address, paymentMethod: 'UPI' })
      clearCart()
      toast.success('Order placed. Continue to UPI QR payment.')
      navigate(`/order-success/${data.order._id}`, { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'We could not place your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length) {
    return (
      <Box className="container-app py-20" sx={{ textAlign: 'center' }}>
        <Typography component="h1" variant="h5" fontWeight={800}>Your cart is empty</Typography>
        <Button component={Link} to="/shop" sx={{ mt: 2 }}>Shop products</Button>
      </Box>
    )
  }

  function updateAddress(event) {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <Box className="container-app py-8 sm:py-12">
      <Typography variant="overline" color="primary.main" fontWeight={700}>Step 2 of 2</Typography>
      <Typography component="h1" variant="h4" fontWeight={800}>Delivery & payment</Typography>
      <Box component="form" onSubmit={placeOrder} sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: 'minmax(0, 1fr) 360px' }, mt: 3 }}>
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800}>Delivery address</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: '1fr 1fr' }, mt: 2.5 }}>
              <OpenFreeMapAddressPicker onAddressSelected={(selectedAddress) => setAddress((current) => ({ ...current, ...selectedAddress }))} />
              {addressFields.map(({ name, label, type, autoComplete, pattern, required = true, inputProps, gridColumn }) => (
                <TextField
                  key={name}
                  name={name}
                  label={label}
                  type={type || 'text'}
                  autoComplete={autoComplete}
                  required={required}
                  fullWidth
                  value={address[name]}
                  onChange={updateAddress}
                  inputProps={{ ...inputProps, ...(pattern ? { pattern } : {}) }}
                  sx={{ gridColumn }}
                />
              ))}
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3, borderColor: 'primary.light', bgcolor: 'primary.light' }}>
            <Typography variant="h6" fontWeight={800}>Payment method</Typography>
            <FormControlLabel
              sx={{ mt: 1, mx: 0, width: '100%', p: 1.5, border: 1, borderColor: 'primary.light', borderRadius: 2, bgcolor: 'background.paper' }}
              control={<Radio checked readOnly />}
              label={<Box><Typography fontWeight={700}>UPI / QR code</Typography><Typography variant="body2" color="text.secondary">A QR for your UPI transfer will be shown after you place the order. An administrator must manually verify and approve the payment.</Typography></Box>}
            />
            <Alert severity="warning" sx={{ mt: 2 }}>
              Transfers may be real. This website does not use a payment gateway or verify bank transfers automatically. Check the recipient and amount in your UPI app before paying.
            </Alert>
          </Paper>
        </Stack>

        <Paper component="aside" variant="outlined" sx={{ height: 'fit-content', p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800}>Your order</Typography>
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {items.map(({ product, qty }) => (
              <Stack key={product._id} direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{product.name} × {qty}</Typography>
                <Typography variant="body2" fontWeight={600}>{formatPrice(product.price * qty)}</Typography>
              </Stack>
            ))}
          </Stack>
          <Stack spacing={1.5} sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
            <SummaryRow label="Delivery" value={shipping ? formatPrice(shipping) : 'Free'} />
            <SummaryRow label="Estimated tax" value={formatPrice(tax)} />
            <SummaryRow label="Total" value={formatPrice(total)} strong />
          </Stack>
          <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} sx={{ mt: 2.5 }}>
            {submitting ? 'Placing order…' : `Continue to UPI QR · ${formatPrice(total)}`}
          </Button>
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1.5 }}>
            Your order remains pending until an administrator approves the payment.
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography variant={strong ? 'subtitle1' : 'body2'} color={strong ? 'text.primary' : 'text.secondary'} fontWeight={strong ? 800 : 400}>{label}</Typography>
      <Typography variant={strong ? 'subtitle1' : 'body2'} fontWeight={strong ? 800 : 600}>{value}</Typography>
    </Stack>
  )
}
