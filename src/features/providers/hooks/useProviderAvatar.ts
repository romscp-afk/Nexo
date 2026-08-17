import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/shared/services/profileService'

export function useUploadProviderAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const { data, error } = await profileService.uploadProviderAvatar(file)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      void queryClient.invalidateQueries({ queryKey: ['my-provider'] })
      void queryClient.invalidateQueries({ queryKey: ['providers'] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
