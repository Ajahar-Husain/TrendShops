import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/admin', label: 'Overview', icon: DashboardOutlinedIcon, end: true },
  { to: '/admin/products', label: 'Products', icon: Inventory2OutlinedIcon },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptLongOutlinedIcon },
  { to: '/admin/payments', label: 'UPI approvals', icon: PaymentsOutlinedIcon },
]

export default function AdminLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: { lg: 'grid' }, gridTemplateColumns: { lg: '260px minmax(0, 1fr)' }, bgcolor: 'grey.50' }}>
      <Paper square elevation={0} sx={{ p: 2.5, borderRight: { lg: 1 }, borderBottom: { xs: 1, lg: 0 }, borderColor: 'divider' }}>
        <Typography component={Link} to="/" variant="h6" color="primary.dark" fontWeight={800} sx={{ textDecoration: 'none' }}>
          TrendShops <Typography component="span" variant="caption" color="text.secondary" fontWeight={700}>ADMIN</Typography>
        </Typography>
        <List component="nav" sx={{ display: 'flex', flexDirection: { xs: 'row', lg: 'column' }, gap: 0.5, mt: 3, p: 0, overflowX: 'auto' }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              end={end}
              sx={{
                minWidth: 'max-content',
                borderRadius: 2,
                '&.active': { bgcolor: 'primary.main', color: 'common.white', '& .MuiListItemIcon-root': { color: 'common.white' } },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}><Icon fontSize="small" /></ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ my: 2, display: { xs: 'none', lg: 'block' } }} />
        <ListItemButton component={Link} to="/" sx={{ display: { xs: 'none', lg: 'flex' }, borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 36 }}><ArrowBackOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Back to storefront" primaryTypographyProps={{ variant: 'body2' }} />
        </ListItemButton>
      </Paper>
      <Box sx={{ minWidth: 0 }}>
        <Paper square elevation={0} sx={{ px: { xs: 2.5, sm: 4 }, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>Store operations</Typography>
        </Paper>
        <Box component="main" sx={{ p: { xs: 2.5, sm: 4 } }}>{children}</Box>
      </Box>
    </Box>
  )
}
