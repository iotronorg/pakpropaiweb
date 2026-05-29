'use client';

import { AnimatePresence, motion } from 'framer-motion';

export type StepState = 'pending' | 'in_progress' | 'complete' | 'failed';

interface Props {
  label: string;
  state: StepState;
  timestamp?: string | null;
}

const stateConfig: Record<StepState, { color: string; icon: React.ReactNode }> = {
  pending: {
    color: 'text-gray-400 border-gray-200',
    icon: <span className="w-4 h-4 rounded-full border-2 border-gray-300 inline-block" />,
  },
  in_progress: {
    color: 'text-blue-600 border-blue-300',
    icon: (
      <svg className="w-4 h-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    ),
  },
  complete: {
    color: 'text-green-600 border-green-300',
    icon: (
      <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  failed: {
    color: 'text-red-600 border-red-300',
    icon: (
      <svg className="w-4 h-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
};

export function ProvisioningStepIndicator({ label, state, timestamp }: Props) {
  const { color, icon } = stateConfig[state];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${color} bg-white`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="font-medium text-sm">{label}</span>
        {timestamp && (
          <span className="ml-auto text-xs text-gray-400">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
