import { Link } from 'react-router-dom'
import { Box, Button, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import DevicesOtherOutlinedIcon from '@mui/icons-material/DevicesOtherOutlined'
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined'
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined'
import { useFeaturedProducts, useProducts } from '../hooks/useProducts'
import ProductGrid from '../components/product/ProductGrid'

const categories = [
  { title: 'Electronics', slug: 'electronics', icon: DevicesOtherOutlinedIcon },
  { title: "Men's Fashion", slug: 'mens-fashion', icon: CheckroomOutlinedIcon },
  { title: "Women's Fashion", slug: 'womens-fashion', icon: CheckroomOutlinedIcon },
  { title: 'Home & Living', slug: 'home-living', icon: HomeOutlinedIcon },
  { title: 'Beauty', slug: 'beauty', icon: SpaOutlinedIcon },
  { title: 'Sports & Fitness', slug: 'sports-fitness', icon: FitnessCenterOutlinedIcon },
]

export default function HomePage() {
  const featured = useFeaturedProducts()
  const latest = useProducts({ limit: 8, sort: '-createdAt' })

  return (
    <Box className="container-app space-y-14 py-7 sm:py-10">
      <section className="overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-card motion-safe:animate-fade-in">
        <div className="grid items-center gap-8 p-5 sm:p-8 md:grid-cols-[1.02fr_.98fr] md:gap-10 md:p-10">
          <div className="max-w-xl">
            <Chip label="THE EVERYDAY EDIT" size="small" sx={{ color: 'secondary.dark', bgcolor: 'secondary.light', fontWeight: 800, letterSpacing: '.04em' }} />
            <Typography component="h1" variant="h1" sx={{ mt: 2.5, color: 'text.primary', fontSize: { xs: '2.35rem', sm: '2.8rem', md: '3.15rem' }, lineHeight: 1.08, fontWeight: 800, letterSpacing: '-.045em' }}>
              Good finds.<br /><Box component="span" sx={{ color: 'primary.main' }}>Better everyday.</Box>
            </Typography>
            <Typography sx={{ mt: 2, maxWidth: 480, color: 'text.secondary', lineHeight: 1.75 }}>
              Thoughtful picks for home, style and everyday life — with clear prices and easy UPI checkout.
            </Typography>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button component={Link} to="/shop" variant="contained" color="primary" endIcon={<ArrowForwardIcon />}>
                Shop the collection
              </Button>
              <Button component={Link} to="/shop?deals=true" variant="outlined" sx={{ color: 'text.primary', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.light' } }}>
                View today’s deals
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-on-surface-variant">
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><VerifiedUserOutlinedIcon fontSize="small" color="primary" /> Secure checkout</Stack>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><LocalShippingOutlinedIcon fontSize="small" color="primary" /> Free delivery over ₹499</Stack>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><SupportAgentOutlinedIcon fontSize="small" color="primary" /> Order support</Stack>
            </div>
          </div>
          <div className="relative min-h-56 overflow-hidden rounded-2xl bg-surface-muted motion-safe:animate-slide-in-right sm:min-h-72">
            <img className="absolute inset-0 h-full w-full object-cover" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85" alt="Curated fashion and lifestyle collection" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/65 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-dark">Thoughtfully selected</span>
              <p className="mt-3 text-xl font-bold text-white sm:text-2xl">Find your next favourite.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing=".08em">EXPLORE</Typography><Typography component="h2" variant="h5" fontWeight={800}>Shop by category</Typography></div>
          <Button component={Link} to="/shop" endIcon={<ArrowForwardIcon />} size="small">View all</Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(({ title, slug, icon: Icon }, index) => (
            <Card
              key={slug}
              className="motion-safe:animate-fade-in-up"
              style={{ animationDelay: `${index * 45}ms` }}
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgb(31 48 37 / .08)', borderColor: 'primary.light' },
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                  '&:hover': { transform: 'none', boxShadow: 'none' },
                },
              }}
            >
              <CardActionArea component={Link} to={`/shop?category=${slug}`} sx={{ height: '100%', borderRadius: 'inherit' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: 'grid', flex: '0 0 auto', width: 42, height: 42, placeItems: 'center', borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                    <Icon sx={{ fontSize: 23 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={800} noWrap>{title}</Typography>
                    <Typography variant="caption" color="text.secondary">Explore</Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing=".08em">TRENDING NOW</Typography><Typography component="h2" variant="h5" fontWeight={800}>Customer favourites</Typography></div>
          <Button component={Link} to="/shop" endIcon={<ArrowForwardIcon />} size="small">View all</Button>
        </div>
        <ProductGrid products={featured.data?.products || []} loading={featured.isLoading} error={featured.isError} onRetry={featured.refetch} />
      </section>

      <Box component="section" sx={{ display: { sm: 'flex' }, alignItems: 'center', justifyContent: 'space-between', gap: 3, p: { xs: 3, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box><Typography variant="overline" color="secondary.dark" fontWeight={800} letterSpacing=".08em">JUST ARRIVED</Typography><Typography component="h2" variant="h5" fontWeight={800}>Fresh picks for your day</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Discover the latest additions to the TrendShops collection.</Typography></Box>
        <Button component={Link} to="/shop?sort=-createdAt" variant="contained" color="primary" endIcon={<ArrowForwardIcon />} sx={{ mt: { xs: 2.5, sm: 0 } }}>Shop new arrivals</Button>
      </Box>
      <ProductGrid products={latest.data?.products || []} loading={latest.isLoading} error={latest.isError} onRetry={latest.refetch} />
    </Box>
  )
}
