"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { useVoiceRoom } from "@/hooks/useVoiceRoom"
import { executeBargeIn, getMe } from "@/lib/api"
import type { VoiceCallSession, VoiceCallStatus } from "@/types"

function CallDurationTimer({ startedAt }: { startedAt: string | null }) {
  const [secs, setSecs] = useState(0)
  useState(() => {
    if (!startedAt) return
    const interval = setInterval(() => {
      setSecs(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  })
  const m = Math.floor(secs / 60).toString().padStart(2, "0")
  const s = (secs % 60).toString().padStart(2, "0")
  return <span className="font-mono text-xs text-gray-400">{m}:{s}</span>
}

const STATUS_BADGE: Record<VoiceCallStatus, string> = {
  ringing:      "bg-yellow-100 text-yellow-700",
  ai_handling:  "bg-blue-100 text-blue-700",
  agent_joined: "bg-green-100 text-green-700",
  completed:    "bg-gray-100 text-gray-500",
  failed:       "bg-red-100 text-red-700",
}

export default function VoicePage() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => getMe().then((r) => r.data) })
  const orgId = (me as { org_id?: string })?.org_id ?? null

  const { activeCalls, transcriptions, isConnected } = useVoiceRoom(orgId)
  const [selectedSid,  setSelectedSid]  = useState<string | null>(null)
  const [bargingIn,    setBargingIn]    = useState<string | null>(null)
  const [latencyChip,  setLatencyChip]  = useState<Record<string, number>>({})
  const [confirmSid,   setConfirmSid]   = useState<string | null>(null)

  const selectedCall = activeCalls.find((c) => c.call_sid === selectedSid) ?? activeCalls[0] ?? null
  const transcript   = selectedCall ? (transcriptions[selectedCall.call_sid] ?? []) : []

  async function handleBargeIn(callSid: string) {
    setBargingIn(callSid)
    try {
      const res = await executeBargeIn(callSid)
      setLatencyChip((p) => ({ ...p, [callSid]: res.latency_ms }))
    } catch { /* status update via WS */ }
    finally {
      setBargingIn(null)
      setConfirmSid(null)
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Live Voice Calls</h1>
        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-gray-300"}`} />
        <span className="text-xs text-gray-400">{isConnected ? "Live" : "Connecting…"}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Active Calls List */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
          {activeCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <span className="text-4xl">🎙</span>
              <p className="text-sm">No active AI calls</p>
            </div>
          ) : (
            <AnimatePresence>
              {activeCalls.map((call) => (
                <motion.div
                  key={call.call_sid}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedSid(call.call_sid)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-white transition-colors ${
                    selectedCall?.call_sid === call.call_sid
                      ? "bg-white border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {call.from_phone.slice(0, -4).replace(/./g, "•") + call.from_phone.slice(-4)}
                    </p>
                    <CallDurationTimer startedAt={call.started_at} />
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[call.status]}`}
                  >
                    {call.status.replace("_", " ")}
                  </span>

                  {latencyChip[call.call_sid] && (
                    <span className="ms-2 text-xs text-green-600">
                      {latencyChip[call.call_sid].toFixed(0)}ms
                    </span>
                  )}

                  {call.status === "ai_handling" && (
                    <button
                      data-testid={`barge-in-btn-${call.call_sid}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmSid(call.call_sid)
                      }}
                      disabled={bargingIn === call.call_sid}
                      className="mt-2 w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      {bargingIn === call.call_sid ? "Joining…" : "Barge In"}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Right — Transcript Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {selectedCall ? (
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedCall.from_phone}</p>
                  <p className="text-xs text-gray-400">{selectedCall.call_sid}</p>
                </div>
                {selectedCall.status === "ai_handling" && (
                  <button
                    onClick={() => setConfirmSid(selectedCall.call_sid)}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold"
                  >
                    Barge In
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2 flex flex-col">
                <AnimatePresence initial={false}>
                  {transcript.map((line, i) => {
                    const isAI    = line.startsWith("[AI]")
                    const isAgent = line.startsWith("[AGENT]")
                    return (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-sm ${
                          isAI ? "text-blue-700" : isAgent ? "text-green-700" : "text-gray-600"
                        }`}
                      >
                        {line}
                      </motion.p>
                    )
                  })}
                </AnimatePresence>
                {transcript.length === 0 && (
                  <p className="text-sm text-gray-400 text-center mt-8">Waiting for speech…</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select a call to view the live transcript
            </div>
          )}
        </div>
      </div>

      {/* Barge-In Confirm Modal */}
      <AnimatePresence>
        {confirmSid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setConfirmSid(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Confirm Barge-In</h2>
              <p className="text-sm text-gray-500 mb-5">
                This will immediately take over the AI call. The client will be notified that a
                team member has joined.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmSid(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBargeIn(confirmSid)}
                  className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"
                >
                  Join Call
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
