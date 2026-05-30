"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  VoiceCallSession,
  VoiceRoomEvent,
  VoiceBargeInEvent,
  VoiceTranscriptionEvent,
} from "@/types"

const MAX_TRANSCRIPT_LINES = 200
const RECONNECT_BASE_MS    = 1_000
const RECONNECT_MAX_MS     = 30_000

interface UseVoiceRoomReturn {
  activeCalls:    VoiceCallSession[]
  transcriptions: Record<string, string[]>  // call_sid → lines
  bargeInEvents:  VoiceBargeInEvent[]
  isConnected:    boolean
}

export function useVoiceRoom(orgId: string | null): UseVoiceRoomReturn {
  const [activeCalls,    setActiveCalls]    = useState<VoiceCallSession[]>([])
  const [transcriptions, setTranscriptions] = useState<Record<string, string[]>>({})
  const [bargeInEvents,  setBargeInEvents]  = useState<VoiceBargeInEvent[]>([])
  const [isConnected,    setIsConnected]    = useState(false)

  const wsRef      = useRef<WebSocket | null>(null)
  const retryDelay = useRef(RECONNECT_BASE_MS)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEvent = useCallback((event: VoiceRoomEvent) => {
    if (event.event === "transcription") {
      const e    = event as VoiceTranscriptionEvent
      const line = `[${e.role.toUpperCase()}] ${e.text}`
      setTranscriptions((prev) => {
        const existing = prev[e.call_sid] ?? []
        const updated  = [...existing, line].slice(-MAX_TRANSCRIPT_LINES)
        return { ...prev, [e.call_sid]: updated }
      })
    } else if (event.event === "call_status") {
      setActiveCalls((prev) =>
        prev.map((c) =>
          c.call_sid === event.call_sid ? { ...c, status: event.status } : c
        )
      )
      if (event.status === "completed" || event.status === "failed") {
        setTimeout(() => {
          setActiveCalls((prev) => prev.filter((c) => c.call_sid !== event.call_sid))
        }, 5_000)
      }
    } else if (event.event === "barge_in") {
      const e = event as VoiceBargeInEvent
      setBargeInEvents((prev) => [e, ...prev].slice(0, 50))
      setActiveCalls((prev) =>
        prev.map((c) => (c.call_sid === e.call_sid ? { ...c, status: "agent_joined" } : c))
      )
    }
  }, [])

  const connect = useCallback(() => {
    if (!orgId) return

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    const host     = process.env.NEXT_PUBLIC_WS_HOST || window.location.host
    const url      = `${protocol}://${host}/ws/voice/room/${orgId}/`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      retryDelay.current = RECONNECT_BASE_MS
    }

    ws.onmessage = (e) => {
      try {
        const event: VoiceRoomEvent = JSON.parse(e.data)
        handleEvent(event)
      } catch { /* ignore malformed */ }
    }

    ws.onclose = () => {
      setIsConnected(false)
      retryTimer.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, RECONNECT_MAX_MS)
        connect()
      }, retryDelay.current)
    }

    ws.onerror = () => ws.close()
  }, [orgId, handleEvent])

  useEffect(() => {
    if (!orgId) return
    import("@/lib/api").then(({ getVoiceCalls }) => {
      getVoiceCalls({ status: "ai_handling" })
        .then((calls) => setActiveCalls(calls))
        .catch(() => {})
    })
    connect()
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
      wsRef.current?.close()
    }
  }, [orgId, connect])

  return { activeCalls, transcriptions, bargeInEvents, isConnected }
}
