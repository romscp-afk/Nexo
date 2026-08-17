import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/shared/services/adminService'
import { supportContactService } from '@/shared/services/supportContactService'

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data, error } = await adminService.getStats()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await adminService.listUsers()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useAdminProviders() {
  return useQuery({
    queryKey: ['admin', 'providers'],
    queryFn: async () => {
      const { data, error } = await adminService.listProviders()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useAdminBookings() {
  return useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: async () => {
      const { data, error } = await adminService.listBookings()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useSetUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await adminService.setUserActive(userId, isActive)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await adminService.deleteUser(userId)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useDeleteProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (providerId: string) => {
      const { error } = await adminService.deleteProvider(providerId)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
  })
}

export function useSetProviderVerified() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ providerId, isVerified }: { providerId: string; isVerified: boolean }) => {
      const { data, error } = await adminService.setProviderVerified(providerId, isVerified)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
  })
}

export function useAdminActivityLogs() {
  return useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: async () => {
      const { data, error } = await adminService.listActivityLogs()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useAdminReports() {
  return useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const { data, error } = await adminService.getReports()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useAdminContactMessages() {
  return useQuery({
    queryKey: ['admin', 'contact-messages'],
    queryFn: async () => {
      const { data, error } = await supportContactService.listForAdmin()
      if (error) throw new Error(error)
      return data
    },
  })
}
