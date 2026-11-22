import { useAuthStore } from '../store/authStore'
import axiosInstance from '../api/axios'
import toast from 'react-hot-toast'

export function useAuth() {
  const { user, token, isLoading, error, login, logout, updateUser, setLoading, setError, isAdmin, isAuthenticated } =
    useAuthStore()

  const loginUser = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axiosInstance.post('/api/auth/login', { email, password })
      login(data.user, data.accessToken)
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`)
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      setError(message)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const registerUser = async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axiosInstance.post('/api/auth/register', formData)
      login(data.user, data.accessToken)
      toast.success(`Welcome to TrendShops, ${data.user.name.split(' ')[0]}!`)
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(message)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logoutUser = async () => {
    try {
      await axiosInstance.post('/api/auth/logout')
    } catch {
      // Ignore errors on logout
    } finally {
      logout()
      toast.success('Logged out successfully')
    }
  }

  const updateProfile = async (updates) => {
    setLoading(true)
    try {
      const { data } = await axiosInstance.put('/api/auth/me', updates)
      updateUser(data.user)
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true)
    try {
      await axiosInstance.put('/api/auth/change-password', { currentPassword, newPassword })
      toast.success('Password changed successfully')
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Password change failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAdmin: isAdmin(),
    isAuthenticated: isAuthenticated(),
    loginUser,
    registerUser,
    logoutUser,
    updateProfile,
    changePassword,
  }
}
