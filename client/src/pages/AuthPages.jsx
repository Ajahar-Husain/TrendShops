import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Button, Link as MuiLink, Paper, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../hooks/useAuth'

function AuthFrame({ title, subtitle, children, footer }) {
  return (
    <Box className="container-app flex min-h-[65vh] items-center justify-center py-12">
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 4 }, borderRadius: 4, boxShadow: 2 }}>
        <MuiLink component={Link} to="/" underline="none" color="primary.dark" fontWeight={800}>TrendShops</MuiLink>
        <Typography component="h1" variant="h4" fontWeight={800} sx={{ mt: 3 }}>{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{subtitle}</Typography>
        {children}
        <Box sx={{ mt: 3, pt: 2.5, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>{footer}</Box>
      </Paper>
    </Box>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginUser, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function submit(event) {
    event.preventDefault()
    const result = await loginUser(email, password)
    if (result.success) navigate(searchParams.get('redirect') || (result.user.role === 'admin' ? '/admin' : '/account/orders'), { replace: true })
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to see your orders and check out faster."
      footer={<>New to TrendShops? <MuiLink component={Link} to="/register" fontWeight={700}>Create an account</MuiLink></>}
    >
      <Stack component="form" spacing={2.5} sx={{ mt: 3 }} onSubmit={submit}>
        <TextField label="Email" type="email" autoComplete="email" required fullWidth value={email} onChange={(event) => setEmail(event.target.value)} />
        <TextField label="Password" type="password" autoComplete="current-password" required fullWidth value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </Stack>
    </AuthFrame>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { registerUser, isLoading } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function submit(event) { event.preventDefault(); const result = await registerUser(form); if (result.success) navigate('/account', { replace: true }) }

  return (
    <AuthFrame
      title="Create your account"
      subtitle="One account for orders, addresses and a faster checkout."
      footer={<>Already have an account? <MuiLink component={Link} to="/login" fontWeight={700}>Sign in</MuiLink></>}
    >
      <Stack component="form" spacing={2.25} sx={{ mt: 3 }} onSubmit={submit}>
        <TextField label="Full name" name="name" autoComplete="name" required inputProps={{ minLength: 2 }} fullWidth value={form.name} onChange={update} />
        <TextField label="Email" type="email" name="email" autoComplete="email" required fullWidth value={form.email} onChange={update} />
        <TextField label="Mobile number (optional)" type="tel" name="phone" autoComplete="tel" inputProps={{ pattern: '[6-9][0-9]{9}' }} fullWidth value={form.phone} onChange={update} />
        <TextField label="Password" type="password" name="password" autoComplete="new-password" required inputProps={{ minLength: 6 }} fullWidth value={form.password} onChange={update} />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </Stack>
    </AuthFrame>
  )
}
