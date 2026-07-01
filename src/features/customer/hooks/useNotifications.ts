import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/shared/services/notificationService'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await notificationService.listMine()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications()
  return data?.filter((n) => !n.readAt).length ?? 0
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await notificationService.markRead(id)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await notificationService.markAllRead()
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
