import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputBase,
  MenuItem,
  MenuList,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import CloseIcon from '@mui/icons-material/Close'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import axiosInstance from '../../api/axios'
import { API } from '../../api/endpoints'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { useAuth } from '../../hooks/useAuth'
import { useCategories } from '../../hooks/useProducts'
import { PRODUCT_CATEGORY_OPTIONS } from '../../utils/constants'

const NAV_CATEGORIES = [
  { label: 'Shop all', href: '/shop' },
  { label: 'Electronics', href: '/shop?category=electronics' },
  { label: "Men's fashion", href: '/shop?category=mens-fashion' },
  { label: "Women's fashion", href: '/shop?category=womens-fashion' },
  { label: 'Home & living', href: '/shop?category=home-living' },
  { label: 'Beauty', href: '/shop?category=beauty' },
  { label: 'Deals', href: '/shop?deals=true' },
]

export default function Header() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { logoutUser, isAdmin, token } = useAuth()
  const categoriesQuery = useCategories()
  const profileQuery = useQuery({
    queryKey: ['profile', user?._id],
    queryFn: async () => (await axiosInstance.get(API.AUTH.ME)).data.user,
    enabled: Boolean(user && token),
  })
  const getItemCount = useCartStore((state) => state.getItemCount)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const accountRef = useRef(null)
  const itemCount = getItemCount()
  const subtotal = getSubtotal()
  const searchCategories = categoriesQuery.data?.categories?.length
    ? categoriesQuery.data.categories
    : PRODUCT_CATEGORY_OPTIONS
  const deliveryAddress = profileQuery.data?.addresses?.find((address) => address.isDefault) || profileQuery.data?.addresses?.[0]
  const deliveryLocation = deliveryAddress
    ? `${deliveryAddress.city} ${deliveryAddress.pincode}`
    : user ? 'Add delivery address' : 'Set delivery location'

  useEffect(() => {
    function handleOutsideClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function handleSearch(event) {
    event.preventDefault()
    const query = searchQuery.trim()
    if (!query && !searchCategory) return
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (searchCategory) params.set('category', searchCategory)
    navigate(`/shop?${params.toString()}`)
    setSearchQuery('')
  }

  async function handleLogout() {
    setAccountOpen(false)
    await logoutUser()
    navigate('/')
  }

  function closeMenus() {
    setMobileMenuOpen(false)
    setAccountOpen(false)
  }

  return (
    <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 50, bgcolor: 'background.paper', boxShadow: 1 }}>
      <Box sx={{ bgcolor: 'primary.dark', color: 'common.white', py: 0.75 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <LocalOfferOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" fontWeight={700} letterSpacing=".04em">
            Free delivery over ₹499 · UPI / QR payment · Order support
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box className="container-app flex min-h-16 items-center gap-3 py-2">
          <IconButton aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMobileMenuOpen((open) => !open)} sx={{ display: { lg: 'none' } }}>
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>

          <Link to="/" onClick={closeMenus} className="shrink-0 no-underline">
            <Box component="img" src="/logo.svg" alt="TrendShops" sx={{ width: { xs: 168, sm: 205, md: 220 }, height: 56, objectFit: 'contain', objectPosition: 'left center', display: 'block' }} />
          </Link>

          <Button
            component={Link}
            to={user ? '/account' : '/login'}
            color="inherit"
            sx={{ display: { xs: 'none', lg: 'flex' }, minWidth: 'max-content', px: 1, textAlign: 'left' }}
          >
            <AddLocationAltOutlinedIcon color="primary" fontSize="small" />
            <Box sx={{ ml: 0.75 }}>
              <Typography variant="caption" display="block" color="text.secondary">Deliver to</Typography>
              <Typography variant="caption" fontWeight={700} noWrap>{deliveryLocation}</Typography>
            </Box>
          </Button>

          <Box component="form" onSubmit={handleSearch} sx={{ display: { xs: 'none', sm: 'flex' }, flex: 1, maxWidth: 720, mx: 'auto', border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Select
              aria-label="Desktop search category"
              size="small"
              value={searchCategory}
              displayEmpty
              onChange={(event) => setSearchCategory(event.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 1,
                    minWidth: 220,
                    maxHeight: 360,
                    bgcolor: '#FFFFFF',
                    color: '#252B27',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    boxShadow: '0 12px 32px rgba(32, 70, 49, 0.18)',
                    '& .MuiMenuItem-root': { color: '#252B27', '&.Mui-selected': { bgcolor: '#EAF1EC', color: '#204631', '&:hover': { bgcolor: '#DCE8DF' } } },
                  },
                },
                MenuListProps: { sx: { py: 0.5 } },
              }}
              sx={{
                minWidth: 145,
                height: 44,
                bgcolor: '#FFFFFF',
                color: '#252B27',
                borderRadius: 0,
                '& .MuiSelect-select': { display: 'flex', alignItems: 'center', fontWeight: 700, color: '#252B27', px: 1.5, fontSize: 14 },
                '& .MuiSvgIcon-root': { color: '#606B64' },
                '& fieldset': { border: 0, borderRight: 1, borderColor: 'divider' },
                '&:hover': { bgcolor: '#F7F8F5' },
              }}
            >
              <MenuItem value="" sx={{ minHeight: 44, fontWeight: 700 }}>All categories</MenuItem>
              {searchCategories.map((category) => <MenuItem key={category.slug} value={category.slug} sx={{ minHeight: 44 }}>{category.name}</MenuItem>)}
            </Select>
            <InputBase
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products and brands"
              inputProps={{ 'aria-label': 'Search products and brands' }}
              sx={{ flex: 1, px: 1.5, fontSize: 14 }}
            />
            <Button type="submit" variant="contained" startIcon={<SearchIcon />} sx={{ borderRadius: 0, px: 2 }}>Search</Button>
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', ml: { xs: 'auto', lg: 0 } }}>
            <Button
              component={Link}
              to={user ? '/account/wishlist' : '/login'}
              startIcon={<FavoriteBorderOutlinedIcon />}
              sx={{ display: { xs: 'none', lg: 'inline-flex' }, color: 'text.secondary' }}
            >
              Wishlist
            </Button>

            <Box ref={accountRef} sx={{ position: 'relative' }}>
              <Button
                onClick={() => setAccountOpen((open) => !open)}
                startIcon={<AccountCircleOutlinedIcon />}
                endIcon={<ExpandMoreIcon />}
                color="inherit"
                aria-label={user ? `Open account menu for ${user.name}` : 'Open account menu'}
                sx={{
                  minWidth: { xs: 40, sm: 64 },
                  px: { xs: 1, sm: 1.5 },
                  whiteSpace: 'nowrap',
                  '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
                  '& .MuiButton-endIcon': { display: { xs: 'none', sm: 'inline-flex' } },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {user ? `Hi, ${user.name.split(' ')[0]}` : 'Account'}
                </Box>
              </Button>
              {accountOpen && (
                <Paper elevation={5} sx={{ position: 'absolute', top: '100%', right: 0, mt: 1, width: 250, py: 1, zIndex: 60 }}>
                  {user && (
                    <>
                      <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
                      </Box>
                      <Divider />
                    </>
                  )}
                  <MenuList dense>
                    {user ? (
                      <>
                        <MenuItem component={Link} to="/account" onClick={closeMenus}><AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />My profile</MenuItem>
                        <MenuItem component={Link} to="/account/orders" onClick={closeMenus}><Inventory2OutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />My orders</MenuItem>
                        {isAdmin && <MenuItem component={Link} to="/admin" onClick={closeMenus}><AdminPanelSettingsOutlinedIcon fontSize="small" color="primary" sx={{ mr: 1.5 }} />Admin portal</MenuItem>}
                        <Divider />
                        <MenuItem onClick={handleLogout}><LogoutOutlinedIcon fontSize="small" color="error" sx={{ mr: 1.5 }} />Sign out</MenuItem>
                      </>
                    ) : (
                      <>
                        <MenuItem component={Link} to="/login" onClick={closeMenus}>Sign in</MenuItem>
                        <MenuItem component={Link} to="/register" onClick={closeMenus}>Create account</MenuItem>
                      </>
                    )}
                  </MenuList>
                </Paper>
              )}
            </Box>

            <Button
              component={Link}
              to="/cart"
              startIcon={<ShoppingCartOutlinedIcon />}
              aria-label={itemCount > 0 ? `Shopping cart, ${itemCount} items` : 'Shopping cart'}
              sx={{
                minWidth: { xs: 40, sm: 64 },
                px: { xs: 1, sm: 1.5 },
                color: 'text.secondary',
                whiteSpace: 'nowrap',
                '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {subtotal > 0 ? `₹${subtotal.toLocaleString('en-IN')}` : 'Cart'}
              </Box>
              {itemCount > 0 && <Typography component="span" variant="caption" color="primary.main" fontWeight={800} sx={{ ml: 0.5 }}>{itemCount}</Typography>}
            </Button>
          </Stack>
        </Box>

        <Box component="form" onSubmit={handleSearch} className="container-app flex gap-2 pb-2 sm:hidden">
          <Select
            aria-label="Search category"
            size="small"
            value={searchCategory}
            displayEmpty
            onChange={(event) => setSearchCategory(event.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  mt: 0.5,
                  minWidth: 210,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  boxShadow: '0 12px 32px rgba(32, 70, 49, 0.18)',
                },
              },
              MenuListProps: { sx: { py: 0.5 } },
            }}
            sx={{
              width: 112,
              height: 40,
              flexShrink: 0,
              bgcolor: '#FFFFFF',
              color: '#252B27',
              '& .MuiSelect-select': { display: 'flex', alignItems: 'center', fontWeight: 700, color: '#252B27', px: 1.25, fontSize: 13 },
              '& .MuiSvgIcon-root': { color: '#606B64' },
              '& fieldset': { borderColor: 'divider' },
              '&:hover': { bgcolor: '#F7F8F5' },
            }}
          >
            <MenuItem value="">All</MenuItem>
            {searchCategories.map((category) => <MenuItem key={category.slug} value={category.slug}>{category.name}</MenuItem>)}
          </Select>
          <InputBase
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products"
            inputProps={{ 'aria-label': 'Search products' }}
            sx={{ flex: 1, minWidth: 0, px: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, fontSize: 14 }}
          />
          <IconButton type="submit" color="primary" aria-label="Search" sx={{ flexShrink: 0 }}><SearchIcon /></IconButton>
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'none', lg: 'block' }, bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Stack className="container-app" direction="row" spacing={0.5} sx={{ alignItems: 'center', minHeight: 42, overflowX: 'auto' }}>
          {NAV_CATEGORIES.map((item) => (
            <Button key={item.label} component={Link} to={item.href} color="inherit" size="small" sx={{ whiteSpace: 'nowrap', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: 'primary.light', color: 'primary.dark' } }}>
              {item.label}
            </Button>
          ))}
          {user?.role === 'admin' && (
            <Button component={Link} to="/admin" color="primary" startIcon={<AdminPanelSettingsOutlinedIcon />} sx={{ ml: 'auto !important', whiteSpace: 'nowrap' }}>
              Admin portal <ArrowForwardOutlinedIcon fontSize="small" />
            </Button>
          )}
        </Stack>
      </Box>

      {mobileMenuOpen && (
        <Paper square elevation={4} sx={{ display: { lg: 'none' }, position: 'absolute', left: 0, right: 0, zIndex: 55 }}>
          <MenuList dense>
            {NAV_CATEGORIES.map((item) => <MenuItem key={item.label} component={Link} to={item.href} onClick={closeMenus}>{item.label}</MenuItem>)}
            {user?.role === 'admin' && (
              <>
                <Divider />
                <MenuItem component={Link} to="/admin" onClick={closeMenus}><AdminPanelSettingsOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />Admin portal</MenuItem>
              </>
            )}
          </MenuList>
        </Paper>
      )}
    </Box>
  )
}
