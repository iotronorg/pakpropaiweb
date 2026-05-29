"use client";

import { AnimatePresence, motion } from "framer-motion";
import type {
  CopilotRecommendation,
  CopilotInventoryCard,
  CopilotTaxSheet,
  CopilotAIResponse,
  CopilotDocLink,
} from "@/types";

interface Props {
  recommendations: CopilotRecommendation[];
  onInsertReply?: (reply: string) => void;
}

function InventoryCardSlot({ card }: { card: CopilotInventoryCard }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-1.5">
      {card.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.thumbnail_url} alt={card.title} className="h-24 w-full object-cover rounded" />
      )}
      <p className="text-xs font-semibold text-gray-800 line-clamp-2">{card.title}</p>
      <div className="flex flex-wrap gap-1.5">
        {card.bedrooms != null && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">{card.bedrooms} bed</span>
        )}
        {card.area_sqm != null && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{card.area_sqm} m²</span>
        )}
        {card.price != null && (
          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
            {card.currency} {card.price.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

function TaxSheetSlot({ sheet }: { sheet: CopilotTaxSheet }) {
  return (
    <details className="rounded-lg border border-amber-100 bg-amber-50 p-3">
      <summary className="text-xs font-semibold text-amber-800 cursor-pointer">
        Tax Sheet — Effective Rate {(sheet.effective_rate * 100).toFixed(1)}%
      </summary>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>WHT</span><span>{sheet.wht_amount?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>CGT</span><span>{sheet.cgt_amount?.toLocaleString()}</span>
        </div>
      </div>
    </details>
  );
}

function AIResponseSlot({ res, onInsert }: { res: CopilotAIResponse; onInsert?: (r: string) => void }) {
  return (
    <div className="rounded-lg border border-violet-100 bg-violet-50 p-3 space-y-2">
      <div className="rounded bg-white p-2 text-xs text-gray-700 border border-violet-100 whitespace-pre-wrap">
        {res.suggested_reply}
      </div>
      {onInsert && (
        <button
          onClick={() => onInsert(res.suggested_reply)}
          className="w-full rounded bg-violet-600 py-1 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
        >
          Use This Reply
        </button>
      )}
    </div>
  );
}

function DocLinkSlot({ doc }: { doc: CopilotDocLink }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2.5">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-800">{doc.title}</p>
        <span className="text-xs text-gray-400">{doc.doc_type}</span>
      </div>
      {doc.url && (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 shrink-0 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-300"
        >
          Open
        </a>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
      <span className="mb-2 flex h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
      <p className="text-xs">Waiting for client messages…</p>
    </div>
  );
}

export function CopilotSuggestionPanel({ recommendations, onInsertReply }: Props) {
  const inventoryItems = recommendations.filter((r) => r.recommendation_type === "inventory_card");
  const taxItems       = recommendations.filter((r) => r.recommendation_type === "tax_sheet");
  const aiItems        = recommendations.filter((r) => r.recommendation_type === "ai_response");
  const docItems       = recommendations.filter((r) => r.recommendation_type === "doc_link");

  const hasAny = recommendations.length > 0;

  return (
    <div data-testid="copilot-panel" className="flex flex-col gap-4 overflow-y-auto p-3">
      {!hasAny && <EmptyState />}

      {/* Inventory */}
      {inventoryItems.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Properties</p>
          <AnimatePresence initial={false}>
            {inventoryItems.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <InventoryCardSlot card={r.content as CopilotInventoryCard} />
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      )}

      {/* AI Reply */}
      {aiItems.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Suggested Reply</p>
          <AnimatePresence initial={false}>
            {aiItems.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <AIResponseSlot res={r.content as CopilotAIResponse} onInsert={onInsertReply} />
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      )}

      {/* Tax Sheet */}
      {taxItems.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tax Info</p>
          {taxItems.map((r) => (
            <TaxSheetSlot key={r.id} sheet={r.content as CopilotTaxSheet} />
          ))}
        </section>
      )}

      {/* Doc Links */}
      {docItems.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Documents</p>
          {docItems.map((r) => (
            <DocLinkSlot key={r.id} doc={r.content as CopilotDocLink} />
          ))}
        </section>
      )}
    </div>
  );
}
