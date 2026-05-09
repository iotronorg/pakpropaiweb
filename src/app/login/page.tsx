"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendOtp, verifyOtp } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { roleHomePath } from "@/lib/utils";
import { User } from "@/types";

const phoneSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});
const otpSchema = z.object({
  code: z.string().length(6, "OTP must be 6 digits"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<"phone" | "otp" | "no-access">("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  async function onSendOtp(data: PhoneForm) {
    setLoading(true);
    setError("");
    try {
      await sendOtp(data.phone);
      setPhone(data.phone);
      // Reset phone input field
      phoneForm.reset();
      setStep("otp");
    } catch {
      setError("Could not send OTP. Check the phone number.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(data: OtpForm) {
    setLoading(true);
    setError("");
    try {
      const res = await verifyOtp(phone, data.code);
      const { user } = res.data as { user: User };
       // Reset OTP input field
      otpForm.reset();
      if (user.role === "user") {
        setStep("no-access");
        return;
      }

      setAuth(user);

      // user_role is non-sensitive; Next.js middleware reads it for routing
      document.cookie = `user_role=${user.role}; path=/; max-age=${7 * 24 * 3600}`;

      router.replace(roleHomePath(user.role));
    } catch {
      setError("Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-blue-700">PakProp</span>
            <span className="rounded-md bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700">AI</span>
          </div>
          <p className="text-sm text-gray-500">Trust Infrastructure for Pakistani Real Estate</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          {step === "no-access" ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <span className="text-2xl">💬</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Use WhatsApp to continue</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your account uses PakProp AI via WhatsApp. The web dashboard is only available for agents, developers, and admins.
              </p>
              <button
                onClick={() => { setStep("phone"); setError(""); }}
                className="w-full rounded-lg border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Sign in with a different number
              </button>
            </div>
          ) : step === "phone" ? (
            <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-5">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
                <p className="mt-1 text-sm text-gray-500">Enter your WhatsApp number to receive an OTP</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  {...phoneForm.register("phone")}
                  type="tel"
                  placeholder="+92 300 1234567"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {phoneForm.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-5">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Enter OTP</h1>
                <p className="mt-1 text-sm text-gray-500">
                  A 6-digit code was sent to <strong>{phone}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-digit code</label>
                <input
                  {...otpForm.register("code")}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm tracking-widest outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {otpForm.formState.errors.code && (
                  <p className="mt-1 text-xs text-red-600">{otpForm.formState.errors.code.message}</p>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Verifying…" : "Verify & Sign in"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("phone"); setError(""); phoneForm.reset(); otpForm.reset();}}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
