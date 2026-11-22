import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      login: (userData, token) =>
        set({
          user: userData,
          token,
          error: null,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          error: null,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      isAdmin: () => get().user?.role === 'admin',
      isAuthenticated: () => !!get().token && !!get().user,
    }),
    {
      name: 'trendshops-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
