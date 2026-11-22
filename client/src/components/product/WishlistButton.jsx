import { IconButton, Tooltip } from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import { useWishlist } from '../../hooks/useWishlist'

export default function WishlistButton({ product }) {
  const { isWishlisted, isLoading, isUpdating, toggleWishlist } = useWishlist()
  const saved = isWishlisted(product._id)
  const label = saved ? 'Remove from wishlist' : 'Add to wishlist'

  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          aria-label={label}
          aria-pressed={saved}
          disabled={isLoading || isUpdating}
          onClick={() => toggleWishlist(product)}
          sx={{
            color: saved ? 'error.main' : 'text.secondary',
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.paper', color: 'error.main' },
            boxShadow: 1,
          }}
        >
          {saved ? <FavoriteIcon /> : <FavoriteBorderOutlinedIcon />}
        </IconButton>
      </span>
    </Tooltip>
  )
}
