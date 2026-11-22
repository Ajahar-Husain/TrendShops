import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import axiosInstance from '../../api/axios'
import { formatDate, formatPrice, getStatusLabel } from '../../utils/formatters'

function useAdminOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await axiosInstance.get('/api/orders/admin/all', { params: { limit: 50 } })).data.orders,
  })
}

function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => (await axiosInstance.get('/api/products', { params: { limit: 50 } })).data.products,
  })
}

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

function PageHeading({ eyebrow, title, description }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="overline" color="primary.main" fontWeight={700}>{eyebrow}</Typography>
      <Typography component="h1" variant="h4" fontWeight={800}>{title}</Typography>
      {description && <Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>}
    </Box>
  )
}

export function AdminDashboardPage() {
  const orders = useAdminOrders()
  const products = useAdminProducts()
  const orderList = orders.data || []
  const revenue = orderList.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.total, 0)
  const stats = [
    ['Orders', orders.data?.length ?? '—', 'Across your latest 50 orders'],
    ['Active products', products.data?.length ?? '—', 'Available in the storefront'],
    ['Paid revenue', formatPrice(revenue), 'Paid orders in recent activity'],
  ]

  return (
    <Box>
      <PageHeading eyebrow="Store operations" title="Dashboard" description="A clear view of your latest store activity." />
      {(orders.isError || products.isError) && <Alert severity="error" sx={{ mb: 3 }}>Some dashboard information could not be loaded. Check your API connection and try again.</Alert>}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: 'repeat(3, 1fr)' } }}>
        {stats.map(([label, value, caption]) => (
          <Paper key={label} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 1.5 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{caption}</Typography>
          </Paper>
        ))}
      </Box>
      <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Stack direction="row" gap={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box><Typography variant="h6" fontWeight={800}>Recent orders</Typography><Typography variant="caption" color="text.secondary">Latest customer activity</Typography></Box>
          <Button component={Link} to="/admin/orders" size="small">View all</Button>
        </Stack>
        {orders.isLoading ? <Typography color="text.secondary" sx={{ py: 4 }}>Loading orders…</Typography> : orderList.length === 0 ? <Typography color="text.secondary" sx={{ py: 4 }}>No orders yet.</Typography> : (
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead><TableRow><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
              <TableBody>{orderList.slice(0, 6).map((order) => (
                <TableRow key={order._id}>
                  <TableCell sx={{ fontWeight: 700 }}>{order.orderNumber}</TableCell><TableCell>{order.user?.name || 'Customer'}</TableCell><TableCell>{formatDate(order.createdAt)}</TableCell><TableCell><OrderStatus status={order.orderStatus} /></TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{formatPrice(order.total)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export function AdminProductsPage() {
  const queryClient = useQueryClient()
  const products = useAdminProducts()
  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await axiosInstance.get('/api/categories')).data.categories })
  const [form, setForm] = useState({ name: '', description: '', price: '', originalPrice: '', stock: '', category: '', brand: '', image: '' })
  const [saving, setSaving] = useState(false)

  async function createProduct(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await axiosInstance.post('/api/products', {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock),
        category: form.category,
        brand: form.brand,
        images: form.image ? [{ url: form.image, alt: form.name, isPrimary: true }] : [],
      })
      setForm({ name: '', description: '', price: '', originalPrice: '', stock: '', category: '', brand: '', image: '' })
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product added to the catalog.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add product.')
    } finally {
      setSaving(false)
    }
  }

  async function deactivateProduct(product) {
    try {
      await axiosInstance.delete(`/api/products/${product._id}`)
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Product removed from the storefront.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this product.')
    }
  }

  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }

  return (
    <Box>
      <PageHeading eyebrow="Catalog" title="Products" />
      <Paper component="form" onSubmit={createProduct} variant="outlined" sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: '1fr 1fr' }, mt: 2, p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ gridColumn: '1 / -1' }}>Add a product</Typography>
        <TextField name="name" label="Product name" required value={form.name} onChange={update} />
        <FormControl required>
          <InputLabel id="admin-category-label">Category</InputLabel>
          <Select labelId="admin-category-label" label="Category" name="category" value={form.category} onChange={update}>
            {categories.data?.map((category) => <MenuItem key={category._id} value={category._id}>{category.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField type="number" label="Price (₹)" name="price" required inputProps={{ min: 0, step: 1 }} value={form.price} onChange={update} />
        <TextField type="number" label="Original price (₹)" name="originalPrice" inputProps={{ min: 0, step: 1 }} value={form.originalPrice} onChange={update} />
        <TextField type="number" label="Stock" name="stock" required inputProps={{ min: 0, step: 1 }} value={form.stock} onChange={update} />
        <TextField label="Brand" name="brand" value={form.brand} onChange={update} />
        <TextField type="url" label="Image URL" name="image" value={form.image} onChange={update} sx={{ gridColumn: '1 / -1' }} />
        <TextField label="Description" name="description" required multiline minRows={3} value={form.description} onChange={update} sx={{ gridColumn: '1 / -1' }} />
        <Button type="submit" variant="contained" disabled={saving || categories.isLoading} sx={{ justifySelf: 'start' }}>{saving ? 'Saving…' : 'Add product'}</Button>
        {categories.isError && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>Could not load categories. Product creation is unavailable.</Alert>}
      </Paper>
      <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={800}>Catalog inventory</Typography>
        {products.isError && <Alert severity="error" sx={{ mt: 2 }}>Could not load catalog products.</Alert>}
        {products.isLoading ? <Typography color="text.secondary" sx={{ py: 4 }}>Loading catalog…</Typography> : (
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead><TableRow><TableCell>Product</TableCell><TableCell>Category</TableCell><TableCell>Price</TableCell><TableCell>Stock</TableCell><TableCell align="right"></TableCell></TableRow></TableHead>
              <TableBody>{products.data?.map((product) => (
                <TableRow key={product._id}>
                  <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell><TableCell>{product.category?.name || '—'}</TableCell><TableCell>{formatPrice(product.price)}</TableCell><TableCell>{product.stock}</TableCell>
                  <TableCell align="right"><Button size="small" color="error" onClick={() => deactivateProduct(product)}>Deactivate</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const orders = useAdminOrders()
  const [savingId, setSavingId] = useState('')

  async function updateStatus(order, status) {
    setSavingId(order._id)
    try {
      await axiosInstance.put(`/api/orders/admin/${order._id}/status`, { status })
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order status updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update order status.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <Box>
      <PageHeading eyebrow="Fulfilment" title="Orders" description="Update fulfilment states for customer orders." />
      {orders.isError && <Alert severity="error" sx={{ mb: 2 }}>Could not load orders.</Alert>}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3 }}>
        {orders.isLoading ? <Typography color="text.secondary" sx={{ py: 4 }}>Loading orders…</Typography> : !orders.data?.length ? <Typography color="text.secondary" sx={{ py: 4 }}>No orders yet.</Typography> : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead><TableRow><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Placed</TableCell><TableCell>Payment</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell>Update status</TableCell></TableRow></TableHead>
              <TableBody>{orders.data.map((order) => (
                <TableRow key={order._id}>
                  <TableCell sx={{ fontWeight: 700 }}>{order.orderNumber}</TableCell><TableCell>{order.user?.name || 'Customer'}</TableCell><TableCell>{formatDate(order.createdAt)}</TableCell><TableCell>{order.paymentMethod} · {order.paymentStatus}</TableCell><TableCell sx={{ fontWeight: 600 }}>{formatPrice(order.total)}</TableCell><TableCell><OrderStatus status={order.orderStatus} /></TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <Select
                        aria-label={`Update status for ${order.orderNumber}`}
                        disabled={savingId === order._id}
                        value={order.orderStatus}
                        onChange={(event) => updateStatus(order, event.target.value)}
                      >
                        {['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].map((status) => <MenuItem key={status} value={status}>{getStatusLabel(status)}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export function AdminPaymentApprovalsPage() {
  const queryClient = useQueryClient()
  const payments = useQuery({
    queryKey: ['upi-payments'],
    queryFn: async () => (await axiosInstance.get('/api/payments/admin/approval-queue')).data.payments,
  })
  const [approvingId, setApprovingId] = useState('')

  async function approvePayment(payment) {
    setApprovingId(payment._id)
    try {
      await axiosInstance.put(`/api/payments/admin/demo/${payment._id}/approve`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['upi-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
      ])
      toast.success('Payment approved and order confirmed.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not approve this payment.')
    } finally {
      setApprovingId('')
    }
  }

  return (
    <Box>
      <PageHeading eyebrow="Manual review" title="UPI payment approvals" description="Verify each transfer in your UPI/bank account before approving. The website cannot verify payments automatically." />
      {payments.isError && <Alert severity="error" sx={{ mb: 2 }}>Could not load the payment approval queue.</Alert>}
      {payments.isLoading && <Typography color="text.secondary">Loading pending payments…</Typography>}
      {!payments.isLoading && !payments.isError && payments.data?.length === 0 && (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed', color: 'text.secondary' }}>No UPI payments are waiting for approval.</Paper>
      )}
      <Stack spacing={2} sx={{ mt: 2 }}>
        {payments.data?.map((payment) => {
          const order = payment.order
          return (
            <Paper component="article" key={payment._id} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Chip label="Awaiting manual verification" color="warning" size="small" sx={{ fontWeight: 700 }} />
                  <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>{order?.orderNumber || 'Order unavailable'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {order?.user?.name || 'Customer'} {order?.user?.email ? `· ${order.user.email}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Submitted {formatDate(payment.updatedAt)} · UPI / QR</Typography>
                </Box>
                <Typography variant="h5" fontWeight={800}>{formatPrice(payment.amount)}</Typography>
              </Stack>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Only approve after checking the matching amount and transaction in your UPI/bank account. The “I have paid” button is not proof of payment.
              </Alert>
              <Button variant="contained" disabled={approvingId === payment._id || !order} onClick={() => approvePayment(payment)} sx={{ mt: 2 }}>
                {approvingId === payment._id ? 'Approving…' : 'Approve payment & confirm order'}
              </Button>
            </Paper>
          )
        })}
      </Stack>
    </Box>
  )
}
