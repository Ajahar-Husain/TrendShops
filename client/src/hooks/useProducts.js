import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import axiosInstance from '../api/axios'

// Fetch product list with filters
export function useProducts(params = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/products', { params })
      return data
    },
  })
}

// Infinite scroll version
export function useInfiniteProducts(params = {}) {
  return useInfiniteQuery({
    queryKey: ['products-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axiosInstance.get('/api/products', {
        params: { ...params, page: pageParam },
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) return lastPage.pagination.page + 1
      return undefined
    },
  })
}

// Fetch single product by slug
export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/products/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}

// Fetch featured products
export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/products/featured')
      return data
    },
  })
}

// Fetch deal products
export function useDealsProducts() {
  return useQuery({
    queryKey: ['products', 'deals'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/products/deals')
      return data
    },
  })
}

// Fetch categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/categories')
      return data
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}
