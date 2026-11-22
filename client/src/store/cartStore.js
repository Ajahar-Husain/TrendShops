import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      couponDiscount: 0,

      // Add item or increment quantity
      addItem: (product, qty = 1, variant = null) => {
        const { items } = get()
        const existing = items.find(
          (item) => item.product._id === product._id && item.variant === variant
        )

        if (existing) {
          set({
            items: items.map((item) =>
              item.product._id === product._id && item.variant === variant
                ? { ...item, qty: item.qty + qty }
                : item
            ),
          })
          toast.success('Cart updated')
        } else {
          set({ items: [...items, { product, qty, variant }] })
          toast.success('Added to cart!')
        }
      },

      // Remove item by productId (and optionally variant)
      removeItem: (productId, variant = null) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.product._id === productId && item.variant === variant)
          ),
        }))
        toast.success('Removed from cart')
      },

      // Update quantity
      updateQty: (productId, qty, variant = null) => {
        if (qty < 1) {
          get().removeItem(productId, variant)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product._id === productId && item.variant === variant
              ? { ...item, qty }
              : item
          ),
        }))
      },

      // Clear entire cart
      clearCart: () => set({ items: [], coupon: null, couponDiscount: 0 }),

      // Apply coupon
      applyCoupon: (coupon, discount) =>
        set({ coupon, couponDiscount: discount }),

      // Remove coupon
      removeCoupon: () => set({ coupon: null, couponDiscount: 0 }),

      // Computed selectors
      getItemCount: () =>
        get().items.reduce((total, item) => total + item.qty, 0),

      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + item.product.price * item.qty,
          0
        ),

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const shipping = subtotal >= 499 ? 0 : 49
        const tax = Math.round(subtotal * 0.18)
        const discount = get().couponDiscount
        return subtotal + shipping + tax - discount
      },

      getShipping: () => {
        const subtotal = get().getSubtotal()
        return subtotal >= 499 ? 0 : 49
      },

      getTax: () => Math.round(get().getSubtotal() * 0.18),
    }),
    {
      name: 'trendshops-cart',
    }
  )
)
