'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { AgentRoomEvent, ConversationMode, TakeControlResponse } from '@/types'
import { takeControl, releaseControl } from '@/lib/api'

interface UseAgentRoomOptions {
  orgId: string
  sessionId: string
  token?: string
  enabled?: boolean
}

export interface UseAgentRoomReturn {
  messages: AgentRoomEvent[]
  connectionState: 'connecting' | 'connected' | 'disconnected'
  conversationMode: ConversationMode
  lockHolder: string | null
  lockHolderName: string | null
  sendMessage: (body: string) => void
  takeControl: () => Promise<void>
  releaseControl: () => Promise<void>
}

export function useAgentRoom({
  orgId,
  sessionId,
  token,
  enabled = true,
}: UseAgentRoomOptions): UseAgentRoomReturn {
  const [messages, setMessages] = useState<AgentRoomEvent[]>([])
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [conversationMode, setConversationMode] = useState<ConversationMode>('AI_MANAGED')
  const [lockHolder, setLockHolder] = useState<string | null>(null)
  const [lockHolderName, setLockHolderName] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayRef = useRef(1000)

  const connect = useCallback(() => {
    if (!enabled || !orgId || !sessionId) return

    const base = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8001'
    // Browsers send httpOnly cookies automatically on the upgrade request.
    // Append ?token= only when an explicit token is provided (e.g. non-browser test clients).
    const url = token
      ? `${base}/ws/agent/org/${orgId}/?token=${token}`
      : `${base}/ws/agent/org/${orgId}/`
    const ws = new WebSocket(url)
    wsRef.current = ws
    setConnectionState('connecting')

    ws.onopen = () => {
      setConnectionState('connected')
      delayRef.current = 1000

      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', session_id: sessionId }))
        }
      }, 60_000)
    }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const event: AgentRoomEvent = JSON.parse(e.data as string)
        if (event.event === 'inbound_message') {
          setMessages(prev => [...prev, event])
        } else if (event.event === 'session_taken') {
          setConversationMode('AGENT_MANAGED')
          setLockHolder(event.agent_id ?? null)
          setLockHolderName(event.agent_name ?? null)
        } else if (
          event.event === 'session_released' ||
          event.event === 'session_reverted'
        ) {
          setConversationMode('AI_MANAGED')
          setLockHolder(null)
          setLockHolderName(null)
        }
      } catch {
        // malformed JSON — ignore
      }
    }

    ws.onclose = () => {
      setConnectionState('disconnected')
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      const delay = Math.min(delayRef.current, 30_000)
      delayRef.current = delay * 2
      reconnectRef.current = setTimeout(connect, delay)
    }
  }, [enabled, orgId, sessionId, token])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [connect])

  const sendMessage = useCallback((body: string) => {
    wsRef.current?.send(JSON.stringify({
      type: 'send_message',
      session_id: sessionId,
      body,
    }))
  }, [sessionId])

  const handleTakeControl = useCallback(async () => {
    setConversationMode('AGENT_MANAGED')
    try {
      await takeControl(sessionId)
    } catch (err) {
      setConversationMode('AI_MANAGED')
      throw err
    }
  }, [sessionId])

  const handleReleaseControl = useCallback(async () => {
    const prevMode = conversationMode
    const prevHolder = lockHolder
    const prevName = lockHolderName
    setConversationMode('AI_MANAGED')
    setLockHolder(null)
    setLockHolderName(null)
    try {
      await releaseControl(sessionId)
    } catch (err) {
      setConversationMode(prevMode)
      setLockHolder(prevHolder)
      setLockHolderName(prevName)
      throw err
    }
  }, [sessionId, conversationMode, lockHolder, lockHolderName])

  return {
    messages,
    connectionState,
    conversationMode,
    lockHolder,
    lockHolderName,
    sendMessage,
    takeControl: handleTakeControl,
    releaseControl: handleReleaseControl,
  }
}
