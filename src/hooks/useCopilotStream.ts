'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { CopilotRecommendation } from '@/types'

const MAX_RECOMMENDATIONS = 10

interface UseCopilotStreamOptions {
  sessionId: string
  token?: string
  enabled?: boolean
}

export function useCopilotStream({
  sessionId,
  token,
  enabled = true,
}: UseCopilotStreamOptions): {
  recommendations: CopilotRecommendation[]
  isConnected: boolean
  lastUpdatedAt: string | null
} {
  const [recommendations, setRecommendations] = useState<CopilotRecommendation[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  const wsRef         = useRef<WebSocket | null>(null)
  const reconnectRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayRef      = useRef(1000)
  const seenIds       = useRef<Set<string>>(new Set())

  const connect = useCallback(() => {
    if (!enabled || !sessionId) return

    const base = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8001'
    const url  = token
      ? `${base}/ws/agent/copilot/session/${sessionId}/?token=${token}`
      : `${base}/ws/agent/copilot/session/${sessionId}/`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      delayRef.current = 1000
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'copilot_update' && Array.isArray(data.recommendations)) {
          const incoming: CopilotRecommendation[] = data.recommendations
            .filter((r: { id: string }) => !seenIds.current.has(r.id))
            .map((r: { id: string; type: string; payload: Record<string, unknown> }) => {
              seenIds.current.add(r.id)
              return {
                id: r.id,
                recommendation_type: r.type as CopilotRecommendation['recommendation_type'],
                content: r.payload,
                created_at: new Date().toISOString(),
              }
            })

          if (incoming.length > 0) {
            setRecommendations((prev) =>
              [...incoming, ...prev].slice(0, MAX_RECOMMENDATIONS),
            )
            setLastUpdatedAt(new Date().toISOString())
          }
        }
      } catch {
        // malformed JSON — ignore
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      wsRef.current = null
      if (enabled) {
        reconnectRef.current = setTimeout(connect, delayRef.current)
        delayRef.current = Math.min(delayRef.current * 2, 30_000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [sessionId, token, enabled])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { recommendations, isConnected, lastUpdatedAt }
}
