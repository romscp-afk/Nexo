import { env } from '@/shared/lib/env'
import {
  ASSISTANT_FAQ,
  NEXO_ASSISTANT_KNOWLEDGE,
  type FaqEntry,
} from '@/shared/lib/assistantKnowledge'
import { categoryService } from '@/shared/services/categoryService'
import type { UserRole } from '@/shared/lib/constants'

export type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export type AssistantContext = {
  userRole?: UserRole | null
  userName?: string | null
}

function scoreFaq(query: string, entry: FaqEntry): number {
  const q = query.toLowerCase()
  let score = 0
  for (const kw of entry.keywords) {
    if (q.includes(kw.toLowerCase())) score += kw.split(' ').length
  }
  return score
}

function localAssistantReply(query: string): string {
  const ranked = ASSISTANT_FAQ.map((entry) => ({ entry, score: scoreFaq(query, entry) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)

  if (ranked.length > 0) {
    return ranked
      .slice(0, 2)
      .map((r) => r.entry.answer)
      .join('\n\n')
  }

  return `I'm Nexo Assistant. I can help with booking, PayNow/Cash payments, provider open requests, demo accounts, and receipts.

Try asking:
• "How do I book a service?"
• "Explain PayNow payment"
• "Demo login details"${
    env.openAiConfigured ? '' : '\n\nTip: Add VITE_OPENAI_API_KEY to .env for smarter AI answers.'
  }`
}

async function fetchCatalogSnippet(): Promise<string> {
  const { data, error } = await categoryService.listCategories()
  if (error || !data?.length) return ''
  return data.map((c) => `- ${c.name} (${c.slug})`).join('\n')
}

function buildSystemPrompt(context: AssistantContext, catalog: string): string {
  const userLine = context.userRole
    ? `Current user: ${context.userName ?? 'User'} (${context.userRole}). Tailor answers to their role when relevant.`
    : 'Current user: guest (not logged in). Mention registration/login when helpful.'

  return `You are Nexo Assistant — a friendly, concise helper for the Nexo Singapore home services marketplace.
Answer questions about how to use the platform: booking, payments, providers, admin, receipts, demo accounts.
Keep answers under 150 words unless detail is needed. Use plain text with line breaks, not markdown headers.
If unsure, say what you know and suggest the relevant dashboard page.
Never invent prices, phone numbers, or policies not in the knowledge base.
PayNow platform number: +6587877525. Cash admin fee: $25 SGD.

${userLine}

${catalog ? `Live service categories:\n${catalog}\n` : ''}

Platform knowledge:
${NEXO_ASSISTANT_KNOWLEDGE}`
}

async function chatWithOpenAI(
  messages: AssistantMessage[],
  context: AssistantContext,
): Promise<string> {
  const catalog = await fetchCatalogSnippet()
  const system = buildSystemPrompt(context, catalog)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(errText || `OpenAI error ${response.status}`)
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return json.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.'
}

export const assistantService = {
  isAiEnabled: () => env.openAiConfigured,

  async sendMessage(
    history: AssistantMessage[],
    userMessage: string,
    context: AssistantContext,
  ): Promise<string> {
    const trimmed = userMessage.trim()
    if (!trimmed) return 'Please type a question.'

    const conversation: AssistantMessage[] = [
      ...history.filter((m) => m.role === 'user' || m.role === 'assistant'),
      { id: 'current', role: 'user', content: trimmed, createdAt: Date.now() },
    ]

    if (env.openAiConfigured) {
      try {
        return await chatWithOpenAI(conversation, context)
      } catch {
        return `${localAssistantReply(trimmed)}\n\n(AI mode unavailable — showing built-in help.)`
      }
    }

    return localAssistantReply(trimmed)
  },
}
