import { useCartStore } from '../store/cartStore'

export function useCart() {
  const {
    items,
    coupon,
    couponDiscount,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    applyCoupon,
    removeCoupon,
    getItemCount,
    getSubtotal,
    getTotal,
    getShipping,
    getTax,
  } = useCartStore()

  const isInCart = (productId, variant = null) =>
    items.some((item) => item.product._id === productId && item.variant === variant)

  const getItemQty = (productId, variant = null) => {
    const item = items.find(
      (item) => item.product._id === productId && item.variant === variant
    )
    return item ? item.qty : 0
  }

  return {
    items,
    coupon,
    couponDiscount,
    itemCount: getItemCount(),
    subtotal: getSubtotal(),
    total: getTotal(),
    shipping: getShipping(),
    tax: getTax(),
    addItem,
    removeItem,
    updateQty,
    clearCart,
    applyCoupon,
    removeCoupon,
    isInCart,
    getItemQty,
  }
}
