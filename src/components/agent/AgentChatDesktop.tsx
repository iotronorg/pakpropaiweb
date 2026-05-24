'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AgentRoomEvent, ConversationMode, WhatsAppMessagePayload } from '@/types'

interface AgentChatDesktopProps {
  messages: AgentRoomEvent[]
  connectionState: 'connecting' | 'connected' | 'disconnected'
  conversationMode: ConversationMode
  lockHolder: string | null
  currentUserId: string
  phone: string
  onSendMessage: (body: string) => void
}

export function AgentChatDesktop({
  messages,
  connectionState,
  conversationMode,
  lockHolder,
  currentUserId,
  phone,
  onSendMessage,
}: AgentChatDesktopProps) {
  const [draft, setDraft] = useState('')
  const canReply =
    conversationMode === 'AGENT_MANAGED' &&
    lockHolder !== null &&
    lockHolder === String(currentUserId)

  function handleSend() {
    const body = draft.trim()
    if (!body || !canReply) return
    onSendMessage(body)
    setDraft('')
  }

  const connBadge = {
    connected:    'bg-green-100 text-green-700',
    connecting:   'bg-yellow-100 text-yellow-700',
    disconnected: 'bg-red-100 text-red-700',
  }[connectionState]

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shrink-0">
        <span className="text-sm font-medium text-slate-700">{phone}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${connBadge}`}>
          {connectionState}
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {messages.map((event, i) => (
            <motion.div
              key={event.timestamp ?? i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble message={event.message} phone={event.phone} />
            </motion.div>
          ))}
        </AnimatePresence>
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm pt-8">
            No messages yet. Waiting for client...
          </p>
        )}
      </div>

      {/* Reply box */}
      <div className="border-t p-3 flex gap-2 shrink-0">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={!canReply}
          placeholder={canReply ? 'Type a reply... (Enter to send)' : 'Take control to reply'}
          rows={2}
          className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={!canReply || !draft.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                     rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
        >
          Send
        </button>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  phone,
}: {
  message?: WhatsAppMessagePayload
  phone?: string
}) {
  if (!message) return null

  return (
    <div className="max-w-sm bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-800 shadow-sm">
      {message.type === 'text' && <p className="whitespace-pre-wrap">{message.text?.body}</p>}
      {message.type === 'audio' && (
        <p className="text-slate-500 italic">Voice message</p>
      )}
      {message.type === 'image' && (
        <p className="text-slate-500 italic">{message.image?.caption || 'Image'}</p>
      )}
      {message.type === 'document' && (
        <p className="text-slate-500 italic">{message.document?.filename || 'Document'}</p>
      )}
      {phone && (
        <p className="text-xs text-slate-400 mt-1">{phone}</p>
      )}
    </div>
  )
}
