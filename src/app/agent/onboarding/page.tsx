'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Loader2, BadgeCheck, Users, Zap } from 'lucide-react';
import { createFreelanceProfile } from '@/lib/api';

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
};

const STEPS = ['Welcome', 'Your Details', 'Done'] as const;

export default function FreelanceOnboardingPage() {
  const [step, setStep] = useState(0);
  const [dir,  setDir]  = useState(1);
  const [licenseNumber, setLicenseNumber] = useState('');
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  const mutation = useMutation({
    mutationFn: () => createFreelanceProfile({ license_number: licenseNumber }),
    onSuccess: () => {
      setDir(1);
      setStep(2);
    },
  });

  function navigate(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  const dur = prefersReduced ? 0 : 0.22;

  return (
    <div className="min-h-dvh bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-lg p-8 w-full max-w-md">

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm" aria-hidden="true">
            <span className="text-white font-bold text-xs">R</span>
          </div>
          <span className="font-bold text-[var(--text-primary)]">RealTron<span className="text-blue-600"> AI</span></span>
        </div>

        {/* Step progress bar with labels */}
        <nav aria-label="Onboarding progress" className="mb-8">
          <div className="flex items-center gap-1 mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none gap-1">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    i <= step ? 'bg-blue-600' : 'bg-[var(--bg-subtle)]'
                  }`}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wide">
            {STEPS.map((s, i) => (
              <span key={s} className={i === step ? 'text-[var(--primary)]' : ''}>{s}</span>
            ))}
          </div>
        </nav>

        {/* Animated steps */}
        <AnimatePresence mode="wait" custom={dir}>

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: dur, ease: 'easeOut' }}
              className="space-y-5"
            >
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Welcome to RealTron AI</h1>
                <p className="text-sm text-[var(--text-muted)]">
                  Set up your agent profile to start receiving AI-qualified leads and managing your pipeline.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: BadgeCheck, text: "Earn a Verified badge — buyers trust you 3× more" },
                  { icon: Users,      text: "Receive AI-qualified leads from connected organizations" },
                  { icon: Zap,        text: "Manage all your leads and listings in one place" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                    <Icon size={16} className="text-[var(--primary)] mt-0.5 shrink-0" aria-hidden="true" />
                    <p className="text-sm text-[var(--text-primary)]">{text}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate(1)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started →
              </button>

              <p className="text-center text-xs text-[var(--text-muted)]">
                Already set up?{' '}
                <Link href="/agent" className="text-[var(--primary)] hover:underline">
                  Go to dashboard
                </Link>
              </p>
            </motion.div>
          )}

          {/* Step 1 — Details */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: dur, ease: 'easeOut' }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Your Details</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Add your license number to speed up verification. You can skip this and add it later.
                </p>
              </div>

              <div>
                <label htmlFor="license-number" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  License Number <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <input
                  id="license-number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. REA-2024-12345"
                  className="w-full border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-[var(--text-muted)]"
                />
                <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                  Enter your real estate license or registration number. Format varies by country.
                </p>
              </div>

              {mutation.isError && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  Failed to create profile. Please try again.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(0)}
                  className="flex-1 py-3 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {mutation.isPending
                    ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Creating…</>
                    : 'Create Profile'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Success */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: dur, ease: 'easeOut' }}
              className="text-center space-y-5"
            >
              <motion.div
                initial={prefersReduced ? false : { scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: prefersReduced ? 0 : 0.4 }}
                className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto"
                aria-hidden="true"
              >
                <CheckCircle2 size={32} className="text-emerald-500" />
              </motion.div>

              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Profile Created</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Your freelance profile is pending verification. While you wait, you can start browsing available organizations to join.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/agent')}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
