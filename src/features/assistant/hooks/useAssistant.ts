import { useCallback, useState } from 'react'
import { assistantService, type AssistantMessage } from '@/shared/services/assistantService'
import { useAuth } from '@/features/auth/context/AuthProvider'

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const WELCOME: AssistantMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm Nexo Assistant. Ask me anything about booking services, PayNow or Cash payments, provider jobs, admin portal, demo accounts, or receipts.",
  createdAt: Date.now(),
}

export function useAssistant() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: AssistantMessage = {
        id: newId(),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      }

      const prior = messages.filter((m) => m.id !== 'welcome')
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)
      setError(null)

      try {
        const reply = await assistantService.sendMessage(
          [...prior, userMsg],
          trimmed,
          { userRole: user?.role, userName: user?.fullName },
        )
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: 'assistant', content: reply, createdAt: Date.now() },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    },
    [loading, messages, user?.fullName, user?.role],
  )

  const reset = useCallback(() => {
    setMessages([WELCOME])
    setError(null)
  }, [])

  return {
    messages,
    loading,
    error,
    send,
    reset,
    isAiEnabled: assistantService.isAiEnabled(),
  }
}
