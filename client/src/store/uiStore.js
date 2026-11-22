import { create } from 'zustand'

export const useUiStore = create((set) => ({
  // Sidebar state (admin)
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Mobile menu
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Search modal
  searchModalOpen: false,
  openSearchModal: () => set({ searchModalOpen: true }),
  closeSearchModal: () => set({ searchModalOpen: false }),

  // Global loading overlay
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  // Cart drawer
  cartDrawerOpen: false,
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),

  // Category filter drawer (mobile)
  filterDrawerOpen: false,
  openFilterDrawer: () => set({ filterDrawerOpen: true }),
  closeFilterDrawer: () => set({ filterDrawerOpen: false }),

  // Notification count badge
  notificationCount: 0,
  setNotificationCount: (count) => set({ notificationCount: count }),
  decrementNotification: () =>
    set((state) => ({
      notificationCount: Math.max(0, state.notificationCount - 1),
    })),
}))
