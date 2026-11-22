import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '../api/axios'
import { API } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'

export function useWishlist() {
  const { user, token } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const queryKey = ['wishlist', user?._id]
  const query = useQuery({
    queryKey,
    queryFn: async () => (await axiosInstance.get(API.AUTH.WISHLIST)).data.products,
    enabled: Boolean(user && token),
  })
  const products = useMemo(() => query.data || [], [query.data])
  const productIds = useMemo(() => new Set(products.map((product) => product._id)), [products])
  const mutation = useMutation({
    mutationFn: async ({ productId, saved }) => {
      const request = saved
        ? axiosInstance.delete(`${API.AUTH.WISHLIST}/${productId}`)
        : axiosInstance.post(`${API.AUTH.WISHLIST}/${productId}`)
      return (await request).data
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(variables.saved ? 'Removed from wishlist.' : 'Added to wishlist.')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Could not update your wishlist.')
    },
  })

  function isWishlisted(productId) {
    return productIds.has(productId)
  }

  function toggleWishlist(product) {
    if (!user || !token) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${redirect}`)
      return
    }

    mutation.mutate({
      productId: product._id,
      saved: isWishlisted(product._id),
    })
  }

  return {
    products,
    isLoading: query.isLoading,
    isError: query.isError,
    isUpdating: mutation.isPending,
    isWishlisted,
    toggleWishlist,
  }
}
