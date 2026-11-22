import { Box, Button, Card, CardContent, CardMedia, Chip, Rating, Stack, Typography } from '@mui/material'
import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined'
import { Link } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { formatPrice } from '../../utils/formatters'
import WishlistButton from './WishlistButton'

export default function ProductCard({ product, animationDelay = 0 }) {
  const addItem = useCartStore((state) => state.addItem)
  const image = product.images?.find((item) => item.isPrimary)?.url || product.images?.[0]?.url

  return (
    <Card
      component="article"
      variant="outlined"
      className="motion-safe:animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease',
        '&:hover': { boxShadow: '0 12px 28px rgb(31 48 37 / .10)', transform: 'translateY(-3px)', borderColor: 'primary.light' },
        '&:hover .MuiCardMedia-root': { transform: 'scale(1.03)' },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          transition: 'none',
          '&:hover': { boxShadow: 1, transform: 'none' },
          '&:hover .MuiCardMedia-root': { transform: 'none' },
        },
      }}
    >
      <Box
        component={Link}
        to={`/product/${product.slug}`}
        sx={{ display: 'block', position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', bgcolor: 'action.hover' }}
      >
        {image ? (
          <CardMedia
            component="img"
            image={image}
            alt={product.name}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 220ms ease' }}
          />
        ) : (
          <Box sx={{ display: 'grid', height: '100%', placeItems: 'center', color: 'text.secondary' }}>
            <AddShoppingCartOutlinedIcon fontSize="large" />
          </Box>
        )}
        {product.discountPercent > 0 && (
          <Chip
            label={`${product.discountPercent}% OFF`}
            color="warning"
            size="small"
            sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }}
          />
        )}
        {product.stock <= 0 && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',           bgcolor: 'rgba(32, 70, 49, .62)' }}>
            <Typography color="common.white" fontWeight={700}>Out of stock</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
        <WishlistButton product={product} />
      </Box>

      <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 1 }}>
        <Typography variant="overline" color="primary.main" fontWeight={700} sx={{ lineHeight: 1.4 }}>
          {product.brand || 'TrendShops pick'}
        </Typography>
        <Typography
          component={Link}
          to={`/product/${product.slug}`}
          variant="subtitle1"
          fontWeight={700}
          color="text.primary"
          sx={{ minHeight: 48, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
        >
          {product.name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Rating value={Number(product.rating || 0)} precision={0.1} readOnly size="small" />
          <Typography variant="caption" color="text.secondary">
            {Number(product.rating || 0).toFixed(1)} ({product.numReviews || 0})
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 'auto', pt: 1 }}>
          <Typography variant="h6" fontWeight={800}>{formatPrice(product.price)}</Typography>
          {product.originalPrice > product.price && (
            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
              {formatPrice(product.originalPrice)}
            </Typography>
          )}
        </Stack>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddShoppingCartOutlinedIcon />}
          disabled={product.stock <= 0}
          onClick={() => addItem(product)}
        >
          Add to cart
        </Button>
      </CardContent>
    </Card>
  )
}
