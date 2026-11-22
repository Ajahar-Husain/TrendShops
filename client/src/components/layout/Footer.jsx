import { Box, Container, Link as MuiLink, Stack, Typography } from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import { Link } from 'react-router-dom'

const linkGroups = [
  { title: 'Customer care', links: [['Track an order', '/account/orders'], ['Returns & refunds', '/account/orders'], ['Help centre', '/account']] },
  { title: 'Shop TrendShops', links: [['All products', '/shop'], ['Electronics', '/shop?category=electronics'], ['Home & living', '/shop?category=home-living']] },
  { title: 'Policies & security', links: [['Privacy policy', '/'], ['Terms of use', '/'], ['Secure checkout', '/cart']] },
]

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 8, bgcolor: 'primary.dark', color: '#F7F7F7' }}>
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: '2fr 1fr 1fr 1fr' }, gap: 5 }}>
          <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
            <MuiLink component={Link} to="/" underline="none" sx={{ color: 'common.white', fontSize: 22, fontWeight: 800 }}>
              Trend<Typography component="span" color="secondary.light" fontWeight={800}>Shops</Typography>
            </MuiLink>
            <Typography sx={{ mt: 1.5, maxWidth: 320, color: 'primary.light', lineHeight: 1.7 }}>
              Thoughtful finds, everyday essentials and a smoother way to shop across India.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 2.5, color: 'secondary.light' }}>
              <CheckCircleOutlinedIcon fontSize="small" />
              <Typography variant="caption" fontWeight={700}>Secure checkout · UPI / QR</Typography>
            </Stack>
          </Box>
          {linkGroups.map((group) => (
            <Box key={group.title}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, color: '#FFFFFF' }}>{group.title}</Typography>
              <Stack spacing={1.5}>
                {group.links.map(([label, href]) => (
                  <MuiLink key={label} component={Link} to={href} underline="hover" sx={{ color: '#FFFFFF', fontSize: 14, '&:hover': { color: '#FFFFFF', opacity: 0.8 } }}>
                    {label}
                  </MuiLink>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      </Container>
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', py: 2, color: '#F7F7F7' }}>
            <Typography variant="caption">© {new Date().getFullYear()} TrendShops India. All rights reserved.</Typography>
            <Typography variant="caption">Made for shoppers across India</Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
