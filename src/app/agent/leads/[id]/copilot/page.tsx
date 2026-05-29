'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getLead } from '@/lib/api'
import { useAgentRoom } from '@/hooks/useAgentRoom'
import { useCopilotStream } from '@/hooks/useCopilotStream'
import { useAuthStore } from '@/store/auth'
import { AgentChatDesktop } from '@/components/agent/AgentChatDesktop'
import { CopilotSuggestionPanel } from '@/components/agent/CopilotSuggestionPanel'
import { TakeControlBar } from '@/components/agent/TakeControlBar'
import type { Lead } from '@/types'

export default function CopilotWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { user } = useAuthStore()

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn:  () => getLead(id).then((r) => r.data),
    enabled:  !!id,
  })

  const sessionId = lead?.wa_session_id ?? ''
  const orgId     = lead?.organization   ?? ''

  const {
    messages,
    connectionState,
    conversationMode,
    lockHolder,
    lockHolderName,
    sendMessage,
    takeControl,
    releaseControl,
  } = useAgentRoom({ orgId, sessionId, enabled: !!sessionId && !!orgId })

  const { recommendations, isConnected } = useCopilotStream({
    sessionId,
    enabled: !!sessionId,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!lead?.wa_session_id) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-sm text-gray-400">
        <p>No active WhatsApp session for this lead.</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">← Back</button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen overflow-hidden"
    >
      {/* Left pane — Agent Chat */}
      <div className="flex flex-1 flex-col min-w-0 border-r border-gray-200">
        <TakeControlBar
          conversationMode={conversationMode}
          lockHolder={lockHolder}
          lockHolderName={lockHolderName}
          currentUserId={String(user?.id ?? '')}
          onTakeControl={takeControl}
          onReleaseControl={releaseControl}
        />
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

      {/* Right pane — Co-Pilot suggestions */}
      <div data-testid="copilot-panel" className="w-[380px] shrink-0 flex flex-col bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-semibold text-gray-900">Co-Pilot</span>
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <CopilotSuggestionPanel
            recommendations={recommendations}
            onInsertReply={(reply) => sendMessage(reply)}
          />
        </div>
      </div>
    </motion.div>
  )
}
