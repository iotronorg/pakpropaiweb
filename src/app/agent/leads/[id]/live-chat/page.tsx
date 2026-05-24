'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getLead } from '@/lib/api'
import { useAgentRoom } from '@/hooks/useAgentRoom'
import { useAuthStore } from '@/store/auth'
import { TakeControlBar } from '@/components/agent/TakeControlBar'
import { AgentChatDesktop } from '@/components/agent/AgentChatDesktop'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Lead } from '@/types'

export default function LiveChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => getLead(id).then((r) => r.data),
    enabled: !!id,
  })

  const sessionId = lead?.wa_session_id ?? ''
  const orgId = lead?.organization ?? ''

  const {
    messages,
    connectionState,
    conversationMode,
    lockHolder,
    lockHolderName,
    sendMessage,
    takeControl,
    releaseControl,
  } = useAgentRoom({
    orgId,
    sessionId,
    enabled: !!sessionId && !!orgId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="font-medium">Lead not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">
          Back
        </button>
      </div>
    )
  }

  if (!lead.wa_session_id) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="font-medium">No active WhatsApp session for this lead</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Back header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Back
        </button>
        <h1 className="text-sm font-semibold text-gray-800 truncate">
          {lead.name || lead.phone}
        </h1>
      </div>

      {/* Take control / release bar */}
      <TakeControlBar
        conversationMode={conversationMode}
        lockHolder={lockHolder}
        lockHolderName={lockHolderName}
        currentUserId={String(user?.id ?? '')}
        onTakeControl={takeControl}
        onReleaseControl={releaseControl}
      />

      {/* Chat */}
      <div className="flex-1 min-h-0">
        <AgentChatDesktop
          messages={messages}
          connectionState={connectionState}
          conversationMode={conversationMode}
          lockHolder={lockHolder}
          currentUserId={String(user?.id ?? '')}
          phone={lead.phone}
          onSendMessage={sendMessage}
        />
      </div>
    </div>
  )
}
