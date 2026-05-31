'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, X } from 'lucide-react';

export type StepState = 'pending' | 'in_progress' | 'complete' | 'failed';

interface Props {
  label: string;
  state: StepState;
  timestamp?: string | null;
}

const stateConfig: Record<StepState, { border: string; text: string; icon: React.ReactNode; ariaLabel: string }> = {
  pending: {
    border: 'border-[var(--border)]',
    text:   'text-[var(--text-muted)]',
    icon:   <span className="w-4 h-4 rounded-full border-2 border-slate-300 inline-block" aria-hidden="true" />,
    ariaLabel: 'Pending',
  },
  in_progress: {
    border: 'border-blue-300',
    text:   'text-blue-600',
    icon:   <Loader2 size={16} className="animate-spin text-blue-500" aria-hidden="true" />,
    ariaLabel: 'In progress',
  },
  complete: {
    border: 'border-emerald-300',
    text:   'text-emerald-600',
    icon:   <Check size={16} className="text-emerald-500" aria-hidden="true" />,
    ariaLabel: 'Complete',
  },
  failed: {
    border: 'border-red-300',
    text:   'text-red-600',
    icon:   <X size={16} className="text-red-500" aria-hidden="true" />,
    ariaLabel: 'Failed',
  },
};

export function ProvisioningStepIndicator({ label, state, timestamp }: Props) {
  const { border, text, icon, ariaLabel } = stateConfig[state];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        role="listitem"
        aria-label={`${label}: ${ariaLabel}`}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${border} bg-[var(--bg-surface)]`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className={`font-medium text-sm ${text}`}>{label}</span>
        {timestamp && (
          <span className="ms-auto text-xs text-[var(--text-muted)]">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
