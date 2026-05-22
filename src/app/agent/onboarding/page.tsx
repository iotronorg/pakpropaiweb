'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createFreelanceProfile } from '@/lib/api';

export default function FreelanceOnboardingPage() {
  const [step, setStep] = useState(1);
  const [licenseNumber, setLicenseNumber] = useState('');
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => createFreelanceProfile({ license_number: licenseNumber }),
    onSuccess: () => setStep(3),
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold mb-2">Welcome, Freelance Agent</h1>
            <p className="text-gray-500 text-sm mb-6">
              Create your global profile to start working with multiple organizations.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Your Details</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number (optional)
            </label>
            <input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. RERA-12345"
              className="w-full border rounded-xl px-4 py-2.5 text-sm mb-4"
            />
            <p className="text-xs text-gray-400 mb-6">
              Your verification status will be updated once we review your credentials.
            </p>
            {mutation.isError && (
              <p className="text-sm text-red-600 mb-3">Failed to create profile. Please try again.</p>
            )}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {mutation.isPending ? 'Creating Profile…' : 'Create Profile'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Profile Created</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your freelance profile is pending verification. You can now join organizations.
            </p>
            <button
              onClick={() => router.push('/agent/dashboard')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
