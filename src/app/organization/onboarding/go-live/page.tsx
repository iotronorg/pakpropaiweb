'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useProvisioningStatus } from '@/hooks/useProvisioningStatus';
import { ProvisioningStepIndicator } from '@/components/onboarding/ProvisioningStepIndicator';
import type { StepState } from '@/components/onboarding/ProvisioningStepIndicator';
import { startProvisioning, retryProvisioning } from '@/lib/api';

function stepState(
  verifiedAt: string | null,
  isCurrentStep: boolean,
  isFailed: boolean,
): StepState {
  if (verifiedAt) return 'complete';
  if (isFailed) return 'failed';
  if (isCurrentStep) return 'in_progress';
  return 'pending';
}

export default function GoLivePage() {
  const qc = useQueryClient();
  const prefersReduced = useReducedMotion();
  const { record, status, isPolling } = useProvisioningStatus();
  const [started, setStarted] = useState(false);

  const startMutation = useMutation({
    mutationFn: startProvisioning,
    onSuccess: () => {
      setStarted(true);
      qc.invalidateQueries({ queryKey: ['provisioning-status'] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryProvisioning,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-status'] });
    },
  });

  const isProvisioning = status === 'provisioning' || isPolling;
  const isFailed       = status === 'failed';
  const isProduction   = status === 'production';
  const lastStep       = record?.last_step ?? '';

  const wabaState = stepState(
    record?.waba_verified_at ?? null,
    isProvisioning && lastStep === 'waba',
    isFailed && lastStep === 'waba',
  );
  const webhookState = stepState(
    record?.webhook_verified_at ?? null,
    isProvisioning && lastStep === 'webhook',
    isFailed && lastStep === 'webhook',
  );
  const templatesState = stepState(
    record?.templates_approved_at ?? null,
    isProvisioning && lastStep === 'templates',
    isFailed && lastStep === 'templates',
  );
  const dataState = stepState(
    record?.data_migrated_at ?? null,
    isProvisioning && lastStep === 'data',
    isFailed && lastStep === 'data',
  );

  if (isProduction) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-base)]">
        <motion.div
          initial={prefersReduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-xl p-10 max-w-md w-full text-center mx-4"
        >
          <motion.div
            initial={prefersReduced ? false : { scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: prefersReduced ? 0 : 0.45, delay: prefersReduced ? 0 : 0.1 }}
            className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6"
            aria-hidden="true"
          >
            <CheckCircle2 size={40} className="text-emerald-500" />
          </motion.div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">You&apos;re live!</h1>
          <p className="text-[var(--text-muted)] mb-4">
            Your WhatsApp Business integration is active and ready to serve clients.
          </p>

          {record && (
            <div className="text-sm text-[var(--text-muted)] mb-6 space-y-1 bg-[var(--bg-muted)] rounded-xl p-4">
              <div>{record.sandbox_leads_migrated} leads migrated</div>
              <div>{record.sandbox_sessions_migrated} sessions migrated</div>
              <div>{record.sandbox_properties_migrated} properties migrated</div>
            </div>
          )}

          <Link
            href="/organization"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Go to Dashboard
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--bg-base)] flex items-center justify-center p-4">
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.3 }}
        className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-xl p-8 max-w-lg w-full"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Go Live</h1>
          <p className="text-[var(--text-muted)] mt-1">
            Connect your WhatsApp Business Account to start serving real clients.
          </p>
        </div>

        <div className="space-y-3 mb-8" role="list" aria-label="Provisioning steps">
          <ProvisioningStepIndicator label="WABA Verification"  state={wabaState}      timestamp={record?.waba_verified_at} />
          <ProvisioningStepIndicator label="Webhook Handshake"  state={webhookState}   timestamp={record?.webhook_verified_at} />
          <ProvisioningStepIndicator label="Template Approval"  state={templatesState} timestamp={record?.templates_approved_at} />
          <ProvisioningStepIndicator label="Data Migration"     state={dataState}      timestamp={record?.data_migrated_at} />
        </div>

        <AnimatePresence mode="wait">
          {isFailed && record?.error_detail && (
            <motion.div
              key="error"
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              <strong>Error:</strong> {record.error_detail}
            </motion.div>
          )}
        </AnimatePresence>

        {startMutation.isError && (
          <p role="alert" className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {(startMutation.error as Error)?.message ?? 'Failed to start provisioning.'}
          </p>
        )}

        <div className="flex gap-3">
          {!started && !isProvisioning && !isFailed && (
            <button
              type="button"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {startMutation.isPending
                ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Starting…</>
                : 'Launch'}
            </button>
          )}

          {isFailed && (
            <button
              type="button"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="flex-1 bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {retryMutation.isPending
                ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Retrying…</>
                : 'Retry'}
            </button>
          )}

          {isProvisioning && (
            <div className="flex-1 flex items-center justify-center gap-2 text-blue-600 py-3">
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              <span className="font-medium">Provisioning in progress…</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
