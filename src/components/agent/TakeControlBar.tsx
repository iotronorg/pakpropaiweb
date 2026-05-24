'use client'

import type { ConversationMode } from '@/types'

interface TakeControlBarProps {
  conversationMode: ConversationMode
  lockHolder: string | null
  lockHolderName: string | null
  currentUserId: string
  onTakeControl: () => Promise<void>
  onReleaseControl: () => Promise<void>
}

export function TakeControlBar({
  conversationMode,
  lockHolder,
  lockHolderName,
  currentUserId,
  onTakeControl,
  onReleaseControl,
}: TakeControlBarProps) {
  const iHoldLock = lockHolder !== null && lockHolder === String(currentUserId)

  if (conversationMode === 'AI_MANAGED') {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200">
        <p className="text-sm font-medium text-amber-800">
          AI is handling this conversation
        </p>
        <button
          onClick={onTakeControl}
          className="px-5 py-1.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-md transition-colors shadow-sm"
        >
          TAKE CONTROL
        </button>
      </div>
    )
  }

  if (iHoldLock) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-green-50 border-b border-green-200">
        <p className="text-sm font-medium text-green-800">You are in control</p>
        <button
          onClick={onReleaseControl}
          className="px-5 py-1.5 text-sm font-semibold bg-slate-500 hover:bg-slate-600 active:bg-slate-700 text-white rounded-md transition-colors"
        >
          RELEASE TO AI
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
      <p className="text-sm font-medium text-slate-700">
        Controlled by {lockHolderName ?? 'another agent'}
      </p>
      <button
        onClick={onTakeControl}
        className="px-5 py-1.5 text-sm font-semibold bg-slate-500 hover:bg-slate-600 active:bg-slate-700 text-white rounded-md transition-colors"
      >
        REQUEST HANDOFF
      </button>
    </div>
  )
}
