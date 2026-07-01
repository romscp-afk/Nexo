import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/shared/services/profileService'
import type { UpdateProfileInput } from '@/shared/types/profile'

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data, error } = await profileService.getMyProfile()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { data, error } = await profileService.updateMyProfile(input)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
  })
}
