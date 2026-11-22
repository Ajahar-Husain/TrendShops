import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import toast from 'react-hot-toast'
import axiosInstance from '../api/axios'
import { API } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import OpenFreeMapAddressPicker from '../components/address/GoogleAddressPicker'

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  label: 'home',
  isDefault: false,
}

const addressFields = [
  { name: 'fullName', label: 'Recipient name', autoComplete: 'name' },
  { name: 'phone', label: 'Mobile number', autoComplete: 'tel', inputProps: { pattern: '[6-9][0-9]{9}', maxLength: 10 } },
  { name: 'line1', label: 'House / flat, street', autoComplete: 'address-line1', gridColumn: '1 / -1' },
  { name: 'line2', label: 'Landmark (optional)', autoComplete: 'address-line2', required: false, gridColumn: '1 / -1' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', autoComplete: 'address-level1' },
  { name: 'pincode', label: 'PIN code', autoComplete: 'postal-code', inputProps: { pattern: '[0-9]{6}', maxLength: 6 } },
  { name: 'country', label: 'Country', autoComplete: 'country-name' },
]

export function AccountPage() {
  const queryClient = useQueryClient()
  const storedUser = useAuthStore((state) => state.user)
  const updateStoredUser = useAuthStore((state) => state.updateUser)
  const profileQueryKey = ['profile', storedUser?._id]
  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => (await axiosInstance.get(API.AUTH.ME)).data.user,
  })
  const profile = profileQuery.data || storedUser
  const addresses = profile?.addresses || []
  const [profileDraft, setProfileDraft] = useState({ name: '', phone: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [verificationSending, setVerificationSending] = useState(false)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState('')
  const [addressDraft, setAddressDraft] = useState(EMPTY_ADDRESS)
  const [addressBusy, setAddressBusy] = useState('')
  const [addressToDelete, setAddressToDelete] = useState(null)
  const profileId = profile?._id
  const profileName = profile?.name || ''
  const profilePhone = profile?.phone || ''

  useEffect(() => {
    if (profileId) setProfileDraft({ name: profileName, phone: profilePhone })
  }, [profileId, profileName, profilePhone])

  function applyProfile(user) {
    queryClient.setQueryData(profileQueryKey, user)
    updateStoredUser({
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      addresses: user.addresses,
    })
  }

  async function saveProfile(event) {
    event.preventDefault()
    setProfileSaving(true)
    try {
      const { data } = await axiosInstance.put(API.AUTH.ME, profileDraft)
      applyProfile(data.user)
      toast.success('Profile details saved.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save your profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function sendVerificationEmail() {
    setVerificationSending(true)
    try {
      const { data } = await axiosInstance.post(API.AUTH.VERIFY_EMAIL)
      toast.success(data.message || 'Check your inbox for the verification link.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send the verification email.')
    } finally {
      setVerificationSending(false)
    }
  }

  function openAddressDialog(address = null) {
    setEditingAddressId(address?._id || '')
    setAddressDraft(address ? { ...EMPTY_ADDRESS, ...address } : { ...EMPTY_ADDRESS, isDefault: addresses.length === 0 })
    setAddressDialogOpen(true)
  }

  function closeAddressDialog() {
    if (addressBusy === 'save') return
    setAddressDialogOpen(false)
  }

  function updateAddressDraft(event) {
    setAddressDraft((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateProfileFromAddressResponse(updatedAddresses) {
    if (!profile) return
    applyProfile({ ...profile, addresses: updatedAddresses })
  }

  async function saveAddress(event) {
    event.preventDefault()
    setAddressBusy('save')
    try {
      const action = editingAddressId ? 'update' : 'add'
      const { data } = await axiosInstance.put('/api/auth/me/addresses', {
        action,
        address: addressDraft,
        ...(editingAddressId && { addressId: editingAddressId }),
      })
      updateProfileFromAddressResponse(data.addresses)
      setAddressDialogOpen(false)
      toast.success(editingAddressId ? 'Address updated.' : 'Address added.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save this address.')
    } finally {
      setAddressBusy('')
    }
  }

  async function updateAddressAction(action, addressId) {
    setAddressBusy(addressId)
    try {
      const { data } = await axiosInstance.put('/api/auth/me/addresses', { action, addressId })
      updateProfileFromAddressResponse(data.addresses)
      if (action === 'delete') setAddressToDelete(null)
      toast.success(action === 'delete' ? 'Address deleted.' : 'Default address updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this address.')
    } finally {
      setAddressBusy('')
    }
  }

  if (profileQuery.isLoading && !profile) {
    return <Box className="container-app flex justify-center py-16"><CircularProgress aria-label="Loading profile" /></Box>
  }

  return (
    <Box className="container-app py-8 sm:py-12">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 3 }}>
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight={700}>Your account</Typography>
          <Typography component="h1" variant="h4" fontWeight={800}>Profile & addresses</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Manage your contact details and saved delivery locations.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={Link} to="/account/orders" variant="outlined">My orders</Button>
          <Button component={Link} to="/account/wishlist" variant="outlined">Wishlist</Button>
        </Stack>
      </Stack>

      {profileQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Could not load your profile. Refresh the page and try again.</Alert>}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: 'minmax(0, 1fr) minmax(320px, .85fr)' }, alignItems: 'start' }}>
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800 }}>{profile?.name?.slice(0, 1)?.toUpperCase() || 'U'}</Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800}>{profile?.name || 'Your profile'}</Typography>
                <Typography variant="body2" color="text.secondary">Customer account</Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />
            <Box component="form" onSubmit={saveProfile}>
              <Stack spacing={2}>
                <TextField
                  label="Full name"
                  name="name"
                  autoComplete="name"
                  required
                  inputProps={{ minLength: 2, maxLength: 50 }}
                  value={profileDraft.name}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                />
                <TextField
                  label="Email address"
                  type="email"
                  value={profile?.email || ''}
                  InputProps={{ readOnly: true }}
                  helperText="Email address cannot be changed here."
                />
                <TextField
                  label="Mobile number"
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  inputProps={{ pattern: '[6-9][0-9]{9}', maxLength: 10 }}
                  value={profileDraft.phone}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, phone: event.target.value }))}
                  helperText="Enter a 10-digit Indian mobile number, or leave blank."
                />
                <Button type="submit" variant="contained" disabled={profileSaving || !profile}>
                  {profileSaving ? 'Saving profile…' : 'Save profile'}
                </Button>
              </Stack>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <EmailOutlinedIcon color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>Email verification</Typography>
                  <Typography variant="body2" color="text.secondary">Verify your email to help secure your account.</Typography>
                </Box>
              </Stack>
              <Chip
                size="small"
                color={profile?.isVerified ? 'success' : 'warning'}
                icon={profile?.isVerified ? <CheckCircleOutlinedIcon /> : undefined}
                label={profile?.isVerified ? 'Verified' : 'Not verified'}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            {profile?.isVerified ? (
              <Alert severity="success" sx={{ mt: 2 }}>Your email address is verified.</Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ mt: 2 }}>We’ll email you a secure, one-time verification link that expires after one hour.</Alert>
                <Button
                  variant="outlined"
                  startIcon={verificationSending ? <CircularProgress size={16} /> : <VerifiedUserOutlinedIcon />}
                  disabled={verificationSending || !profile}
                  onClick={sendVerificationEmail}
                  sx={{ mt: 2 }}
                >
                  {verificationSending ? 'Sending email…' : 'Send verification link'}
                </Button>
              </>
            )}
          </Paper>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Delivery addresses</Typography>
              <Typography variant="body2" color="text.secondary">{addresses.length} saved location{addresses.length === 1 ? '' : 's'}</Typography>
            </Box>
            <Button startIcon={<AddOutlinedIcon />} onClick={() => openAddressDialog()}>Add address</Button>
          </Stack>

          {addresses.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderStyle: 'dashed' }}>
              <AddLocationAltOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
              <Typography fontWeight={700} sx={{ mt: 1 }}>No saved addresses yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Add a delivery location to make checkout faster.</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {addresses.map((address) => (
                <Paper key={address._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography fontWeight={800}>{address.fullName}</Typography>
                        <Chip size="small" variant="outlined" label={address.label || 'home'} sx={{ textTransform: 'capitalize' }} />
                        {address.isDefault && <Chip size="small" color="success" label="Default" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                        {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
                        {address.city}, {address.state} {address.pincode}<br />
                        {address.country || 'India'} · {address.phone}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title="Edit address">
                        <IconButton aria-label={`Edit ${address.label || 'saved'} address`} size="small" disabled={Boolean(addressBusy)} onClick={() => openAddressDialog(address)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete address">
                        <IconButton aria-label={`Delete ${address.label || 'saved'} address`} size="small" color="error" disabled={Boolean(addressBusy)} onClick={() => setAddressToDelete(address)}>
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  {!address.isDefault && (
                    <Button size="small" disabled={Boolean(addressBusy)} onClick={() => updateAddressAction('setDefault', address._id)} sx={{ mt: 1 }}>
                      {addressBusy === address._id ? 'Updating…' : 'Make default'}
                    </Button>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <Dialog open={addressDialogOpen} onClose={closeAddressDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingAddressId ? 'Edit delivery address' : 'Add delivery address'}</DialogTitle>
        <Box component="form" onSubmit={saveAddress}>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, pt: 1 }}>
              <OpenFreeMapAddressPicker
                onAddressSelected={(selectedAddress) => setAddressDraft((current) => ({ ...current, ...selectedAddress }))}
              />
              {addressFields.map(({ name, label, autoComplete, required = true, inputProps, gridColumn }) => (
                <TextField
                  key={name}
                  label={label}
                  name={name}
                  autoComplete={autoComplete}
                  required={required}
                  inputProps={inputProps}
                  value={addressDraft[name]}
                  onChange={updateAddressDraft}
                  sx={{ gridColumn }}
                />
              ))}
              <FormControl sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                <InputLabel id="address-label">Address type</InputLabel>
                <Select labelId="address-label" label="Address type" name="label" value={addressDraft.label} onChange={updateAddressDraft}>
                  <MenuItem value="home">Home</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                <FormControlLabel
                  control={<Checkbox checked={addressDraft.isDefault} onChange={(event) => setAddressDraft((current) => ({ ...current, isDefault: event.target.checked }))} />}
                  label="Set as default delivery address"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={closeAddressDialog} disabled={addressBusy === 'save'}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addressBusy === 'save'}>
              {addressBusy === 'save' ? 'Saving…' : 'Save address'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(addressToDelete)} onClose={() => !addressBusy && setAddressToDelete(null)}>
        <DialogTitle>Delete this address?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">This delivery location will be removed from your account.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddressToDelete(null)} disabled={Boolean(addressBusy)}>Keep address</Button>
          <Button color="error" variant="contained" disabled={Boolean(addressBusy)} onClick={() => updateAddressAction('delete', addressToDelete._id)}>
            {addressBusy === addressToDelete?._id ? 'Deleting…' : 'Delete address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const updateUser = useAuthStore((state) => state.updateUser)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)

  async function verifyEmail() {
    setVerifying(true)
    try {
      const { data } = await axiosInstance.post(API.AUTH.VERIFY_EMAIL_CONFIRM, { token })
      setResult({ success: true, message: data.message })
      updateUser({ email: data.email, isVerified: true })
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'This verification link is invalid or has expired.',
      })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Box className="container-app flex min-h-[60vh] items-center justify-center py-12">
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 520, p: { xs: 3, sm: 4 }, borderRadius: 4, textAlign: 'center' }}>
        <VerifiedUserOutlinedIcon color={result?.success ? 'success' : 'primary'} sx={{ fontSize: 52 }} />
        <Typography component="h1" variant="h4" fontWeight={800} sx={{ mt: 1.5 }}>Verify your email</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Confirm that you can access the email address on your TrendShops account.</Typography>
        {!token && <Alert severity="error" sx={{ mt: 2 }}>This verification link is missing its token. Request a new link from your profile.</Alert>}
        {result && <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2 }}>{result.message}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center', mt: 3 }}>
          {!result?.success && (
            <Button variant="contained" disabled={!token || verifying} onClick={verifyEmail} startIcon={verifying ? <CircularProgress size={16} /> : <CheckCircleOutlinedIcon />}>
              {verifying ? 'Verifying…' : 'Verify email address'}
            </Button>
          )}
          <Button component={Link} to="/account" variant={result?.success ? 'contained' : 'outlined'}>Go to profile</Button>
        </Stack>
      </Paper>
    </Box>
  )
}
