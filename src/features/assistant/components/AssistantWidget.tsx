import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { useAssistant } from '@/features/assistant/hooks/useAssistant'
import { SUGGESTED_QUESTIONS } from '@/shared/lib/assistantKnowledge'
import { cn } from '@/shared/lib/utils'

function FormattedText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  )
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, loading, error, send, reset, isAiEnabled } = useAssistant()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    void send(input)
    setInput('')
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-nexo-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-nexo-900/30 transition hover:bg-nexo-700 hover:shadow-xl"
          aria-label="Open Nexo Assistant"
        >
          <MessageCircle className="h-5 w-5" />
          Ask Nexo
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-5 right-5 z-50 flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-label="Nexo Assistant"
        >
          <header className="flex items-center justify-between border-b border-nexo-200 bg-gradient-to-r from-nexo-700 to-nexo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-nexo-accent" />
              <div>
                <p className="font-semibold leading-tight">Nexo Assistant</p>
                <p className="text-xs text-nexo-mint/80">
                  {isAiEnabled ? 'AI-powered help' : 'Built-in help guide'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg px-2 py-1 text-xs text-nexo-mint/80 hover:bg-white/10"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-nexo-mint/80 hover:bg-white/10"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex max-h-80 min-h-64 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'ml-auto bg-nexo-600 text-white'
                    : 'mr-auto bg-slate-100 text-slate-800',
                )}
              >
                {msg.role === 'assistant' ? (
                  <FormattedText content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-auto rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                Thinking…
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="border-t border-slate-100 px-3 py-2">
              <p className="mb-2 text-xs text-slate-500">Suggested:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-left text-xs text-slate-700 hover:bg-nexo-50 hover:text-nexo-800"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-100 p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Nexo…"
              disabled={loading}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-nexo-400 focus:ring-1 focus:ring-nexo-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex shrink-0 items-center justify-center rounded-xl bg-nexo-600 p-2.5 text-white hover:bg-nexo-700 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
