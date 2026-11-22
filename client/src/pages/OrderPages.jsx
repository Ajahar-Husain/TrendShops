import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CardMedia,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import axiosInstance from '../api/axios'
import { formatDate, formatPrice, getStatusLabel } from '../utils/formatters'
import { useAuthStore } from '../store/authStore'
import { useWishlist } from '../hooks/useWishlist'
import ProductGrid from '../components/product/ProductGrid'

function OrderStatus({ status }) {
  const colorByStatus = {
    pending: 'warning',
    confirmed: 'info',
    processing: 'info',
    shipped: 'secondary',
    out_for_delivery: 'warning',
    delivered: 'success',
    cancelled: 'error',
    returned: 'default',
    refunded: 'success',
  }
  return <Chip size="small" color={colorByStatus[status] || 'default'} label={getStatusLabel(status)} sx={{ fontWeight: 700 }} />
}

export function OrderSuccessPage() {
  const { orderId } = useParams()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['order', orderId], queryFn: async () => (await axiosInstance.get(`/api/orders/${orderId}`)).data.order })
  const order = query.data
  const paymentQuery = useQuery({
    queryKey: ['upi-payment', orderId],
    queryFn: async () => (await axiosInstance.get(`/api/payments/demo/${orderId}`)).data,
    enabled: Boolean(order && order.paymentMethod === 'UPI'),
    refetchInterval: (state) => state.state.data?.payment?.status === 'pending_approval' ? 4000 : false,
  })
  const [qrImage, setQrImage] = useState('')
  const [qrError, setQrError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    const payload = paymentQuery.data?.qrPayload
    if (!payload) return () => { active = false }
    QRCode.toDataURL(payload, { width: 240, margin: 2 })
      .then((dataUrl) => { if (active) setQrImage(dataUrl) })
      .catch((error) => { if (active) setQrError(error.message) })
    return () => { active = false }
  }, [paymentQuery.data?.qrPayload])

  async function submitUpiPayment() {
    setSubmitting(true)
    try {
      await axiosInstance.post(`/api/payments/demo/${orderId}/submit`)
      await Promise.all([
        paymentQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
      ])
      toast.success('Submitted for admin approval.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit this payment.')
    } finally {
      setSubmitting(false)
    }
  }

  const paymentStatus = paymentQuery.data?.payment?.status
  const approved = paymentStatus === 'paid'
  const awaitingApproval = paymentStatus === 'pending_approval'

  return (
    <Box className="container-app py-8 sm:py-12">
      <Paper variant="outlined" sx={{ maxWidth: 820, mx: 'auto', p: { xs: 2.5, sm: 4 }, borderRadius: 4 }}>
        <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
          <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 56 }} />
          <Typography variant="overline" color="success.main" fontWeight={700} sx={{ mt: 1.5 }}>{approved ? 'Payment approved' : 'Order placed'}</Typography>
          <Typography component="h1" variant="h4" fontWeight={800}>{approved ? 'Your order is confirmed' : 'Complete your UPI payment'}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {order ? `Order ${order.orderNumber} · ${formatPrice(order.total)}` : query.isLoading ? 'Loading your order details…' : 'Your order has been placed.'}
          </Typography>
        </Stack>
        {query.isError && <Alert severity="error" sx={{ mt: 2 }}>Order details could not be loaded. Check My Orders.</Alert>}

        {order?.paymentMethod === 'UPI' && (
          <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'primary.light', borderColor: 'primary.light' }}>
            <Typography variant="h6" fontWeight={800}>UPI / QR payment</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
              Scan this QR and verify the recipient and amount in your UPI app before completing the transfer. Then request manual admin verification.
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: '1fr auto' }, alignItems: 'center', mt: 2.5 }}>
              <Stack spacing={1}>
                <Typography variant="body2"><b>UPI ID:</b> {paymentQuery.data?.upiVpa || (paymentQuery.isLoading ? 'Loading…' : 'Unavailable')}</Typography>
                <Typography variant="body2"><b>Amount:</b> <Typography component="span" color="primary.dark" fontWeight={800}>{formatPrice(order.total)}</Typography></Typography>
                {paymentQuery.isError && <Alert severity="error">Could not load payment instructions. Refresh this page to retry.</Alert>}
                {qrError && <Alert severity="error">QR code error: {qrError}</Alert>}
              </Stack>
              {qrImage ? (
                <CardMedia component="img" image={qrImage} alt={`UPI payment QR for order ${order.orderNumber}`} sx={{ width: 192, height: 192, mx: 'auto', p: 1, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white' }} />
              ) : (
                <Paper variant="outlined" sx={{ width: 192, height: 192, display: 'grid', placeItems: 'center', mx: 'auto', p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  {qrError ? 'QR could not be generated' : 'Preparing QR…'}
                </Paper>
              )}
            </Box>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Manual verification required. This QR can initiate a real UPI transfer. Confirm the recipient and amount before paying. This website has no payment gateway and cannot verify bank transfers automatically. An administrator must check the transfer in the bank/UPI account before approving.
            </Alert>
            {paymentStatus === 'created' && (
              <Button variant="contained" disabled={submitting} onClick={submitUpiPayment} sx={{ mt: 2 }}>
                {submitting ? 'Submitting…' : 'I have paid — request admin approval'}
              </Button>
            )}
            {awaitingApproval && <Alert severity="info" sx={{ mt: 2 }}>Payment submitted. Waiting for an administrator to verify it.</Alert>}
            {approved && <Alert severity="success" sx={{ mt: 2 }}>Payment verified and order confirmed.</Alert>}
          </Paper>
        )}

        {order && (
          <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Stack direction="row" gap={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontWeight={700}>{order.orderNumber}</Typography>
              <OrderStatus status={order.orderStatus} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{order.items.length} item(s) · {formatPrice(order.total)} · UPI / QR</Typography>
          </Paper>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center', mt: 3 }}>
          <Button component={Link} to="/account/orders" variant="contained">View my orders</Button>
          <Button component={Link} to="/shop" variant="outlined">Continue shopping</Button>
        </Stack>
      </Paper>
    </Box>
  )
}

export function MyOrdersPage() {
  const query = useQuery({ queryKey: ['my-orders'], queryFn: async () => (await axiosInstance.get('/api/orders/my-orders')).data.orders })
  return (
    <Box className="container-app py-8 sm:py-12">
      <Typography variant="overline" color="primary.main" fontWeight={700}>Your shopping history</Typography>
      <Typography component="h1" variant="h4" fontWeight={800}>My orders</Typography>
      {query.isLoading && <Typography color="text.secondary" sx={{ mt: 3 }}>Loading your orders…</Typography>}
      {query.isError && <Alert severity="error" sx={{ mt: 3 }}>Could not load orders. Please refresh and try again.</Alert>}
      {query.data?.length === 0 && (
        <Paper variant="outlined" sx={{ mt: 3, p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
          <Typography fontWeight={700}>No orders yet.</Typography>
          <Button component={Link} to="/shop" sx={{ mt: 1 }}>Start browsing</Button>
        </Paper>
      )}
      <Stack spacing={2} sx={{ mt: 3 }}>
        {query.data?.map((order) => (
          <Paper key={order._id} component={Link} to={`/account/orders/${order._id}`} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, color: 'inherit', textDecoration: 'none', '&:hover': { boxShadow: 3 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
              <Box><Typography variant="caption" color="text.secondary">{formatDate(order.createdAt)}</Typography><Typography variant="subtitle1" fontWeight={800}>{order.orderNumber}</Typography></Box>
              <OrderStatus status={order.orderStatus} />
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">{order.items.map((item) => `${item.name} × ${item.qty}`).join(', ')}</Typography>
              <Typography fontWeight={800}>{formatPrice(order.total)}</Typography>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}

export function OrderDetailPage() {
  const { orderId } = useParams()
  const query = useQuery({ queryKey: ['order', orderId], queryFn: async () => (await axiosInstance.get(`/api/orders/${orderId}`)).data.order })
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const order = query.data

  async function cancelOrder() {
    try {
      await axiosInstance.put(`/api/orders/${orderId}/cancel`, { reason: 'Customer requested cancellation' })
      toast.success('Order cancelled.')
      query.refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not cancel this order.')
    }
  }

  if (query.isLoading) return <Box className="container-app py-16"><Typography color="text.secondary">Loading order…</Typography></Box>
  if (query.isError || !order) {
    return <Box className="container-app py-16"><Alert severity="error">Could not load this order.<Button onClick={() => navigate('/account/orders')} sx={{ ml: 1 }}>Back to orders</Button></Alert></Box>
  }

  return (
    <Box className="container-app py-8 sm:py-12">
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight={700}>Order details</Typography>
          <Typography component="h1" variant="h4" fontWeight={800}>{order.orderNumber}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Placed {formatDate(order.createdAt)}</Typography>
        </Box>
        <OrderStatus status={order.orderStatus} />
      </Stack>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: 'minmax(0, 1fr) 320px' }, mt: 3 }}>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800}>Items in this order</Typography>
            <Stack divider={<Divider flexItem />} sx={{ mt: 2 }}>
              {order.items.map((item, index) => (
                <Stack key={`${item.product?._id || item.name}-${index}`} direction="row" spacing={2} sx={{ alignItems: 'center', py: 1.5 }}>
                  <CardMedia component="img" image={item.image} alt="" sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: 'grey.100', objectFit: 'cover' }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}><Typography fontWeight={600}>{item.name}</Typography><Typography variant="caption" color="text.secondary">Qty {item.qty}</Typography></Box>
                  <Typography fontWeight={700}>{formatPrice(item.price * item.qty)}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800}>Order updates</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {order.timeline?.map((step, index) => (
                <Stack key={`${step.status}-${index}`} direction="row" spacing={1.5}>
                  <LocalShippingOutlinedIcon color="primary" fontSize="small" />
                  <Box><Typography variant="body2" fontWeight={700}>{getStatusLabel(step.status)}</Typography><Typography variant="body2" color="text.secondary">{step.message}</Typography><Typography variant="caption" color="text.secondary">{formatDate(step.timestamp)}</Typography></Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Stack>
        <Stack component="aside" spacing={2} sx={{ height: 'fit-content' }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800}>Payment summary</Typography>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <SummaryRow label="Payment method" value={order.paymentMethod === 'UPI' ? 'UPI / QR' : order.paymentMethod} />
              <SummaryRow label="Payment status" value={order.paymentStatus} />
              <Divider />
              <SummaryRow label="Total" value={formatPrice(order.total)} strong />
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800}>Delivery address</Typography>
            <Typography fontWeight={600} sx={{ mt: 1.5 }}>{order.shippingAddress.fullName}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
              {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
              {order.shippingAddress.phone}
            </Typography>
          </Paper>
          {user?._id === order.user?._id && ['pending', 'confirmed', 'processing'].includes(order.orderStatus) && (
            <Button variant="outlined" color="error" onClick={cancelOrder}>Cancel order</Button>
          )}
        </Stack>
      </Box>
    </Box>
  )
}

export function WishlistPage() {
  const { products, isLoading, isError } = useWishlist()

  return (
    <Box className="container-app py-8 sm:py-12">
      <Typography variant="overline" color="primary.main" fontWeight={700}>Saved for later</Typography>
      <Typography component="h1" variant="h4" fontWeight={800}>Your wishlist</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Your saved products stay with your account across visits.</Typography>
      {isError && <Alert severity="error" sx={{ mt: 3 }}>Could not load your wishlist. Please try again.</Alert>}
      {!isLoading && !isError && products.length === 0 ? (
        <Paper variant="outlined" sx={{ mt: 3, p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700}>Your wishlist is empty</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Tap the heart on a product to save it here.</Typography>
          <Button component={Link} to="/shop" variant="contained" sx={{ mt: 2.5 }}>Explore products</Button>
        </Paper>
      ) : (
        <Box sx={{ mt: 3 }}>
          <ProductGrid products={products} loading={isLoading} error={false} />
        </Box>
      )}
    </Box>
  )
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color={strong ? 'text.primary' : 'text.secondary'} fontWeight={strong ? 800 : 400}>{label}</Typography>
      <Typography variant="body2" fontWeight={strong ? 800 : 600}>{value}</Typography>
    </Stack>
  )
}
