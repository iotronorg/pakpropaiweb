'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
  const isFailed = status === 'failed';
  const isProduction = status === 'production';

  const lastStep = record?.last_step ?? '';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're live!</h1>
          <p className="text-gray-500 mb-2">
            Your WhatsApp Business integration is active and ready to serve clients.
          </p>
          {record && (
            <div className="text-sm text-gray-400 mb-6 space-y-1">
              <div>{record.sandbox_leads_migrated} leads migrated</div>
              <div>{record.sandbox_sessions_migrated} sessions migrated</div>
              <div>{record.sandbox_properties_migrated} properties migrated</div>
            </div>
          )}
          <a
            href="/organization/dashboard"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Go Live</h1>
          <p className="text-gray-500 mt-1">
            Connect your WhatsApp Business Account to start serving real clients.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <ProvisioningStepIndicator
            label="WABA Verification"
            state={wabaState}
            timestamp={record?.waba_verified_at}
          />
          <ProvisioningStepIndicator
            label="Webhook Handshake"
            state={webhookState}
            timestamp={record?.webhook_verified_at}
          />
          <ProvisioningStepIndicator
            label="Template Approval"
            state={templatesState}
            timestamp={record?.templates_approved_at}
          />
          <ProvisioningStepIndicator
            label="Data Migration"
            state={dataState}
            timestamp={record?.data_migrated_at}
          />
        </div>

        <AnimatePresence mode="wait">
          {isFailed && record?.error_detail && (
            <motion.div
              key="error"
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
          <p className="text-red-600 text-sm mb-4">
            {(startMutation.error as Error)?.message ?? 'Failed to start provisioning.'}
          </p>
        )}

        <div className="flex gap-3">
          {!started && !isProvisioning && !isFailed && (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {startMutation.isPending ? 'Starting…' : 'Launch'}
            </button>
          )}
          {isFailed && (
            <button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {retryMutation.isPending ? 'Retrying…' : 'Retry'}
            </button>
          )}
          {isProvisioning && (
            <div className="flex-1 flex items-center justify-center gap-2 text-blue-600">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="font-medium">Provisioning in progress…</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
