import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast"; // Import toast
import {
  ShieldCheck,
  Phone,
  Lock,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

const ResetPin = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPin, setShowPin] = useState(false);
  const [showOtp, setShowOtp] = useState(false); // Optional: also for the OTP

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Capture the response from the server
      const response = await api.post(
        "https://safe-track-8a62.onrender.com/api/auth/forgot-pin",
        {
          phone_number: phone,
          reason: "reset",
        },
      );

      // 2. Check if the backend sent a dev_otp and show it in a toast
      if (response.data && response.data.dev_otp) {
        toast(`Verification Code: ${response.data.dev_otp}`, {
          duration: 15000, // 15 seconds to give plenty of time
          position: "top-center",
          // Custom styling to match your #0f172a theme
          style: {
            borderRadius: "16px",
            background: "#0f172a",
            color: "#fff",
            padding: "16px",
            fontSize: "16px",
            fontWeight: "bold",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          },
          // Adding a nice icon
          icon: "🔑",
        });
      }

      setStep(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.message || "User not found. Check the number.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(
        "https://safe-track-8a62.onrender.com/api/auth/reset-pin",
        {
          phone_number: phone,
          otp: otp,
        },
      );

      await api.post("https://safe-track-8a62.onrender.com/api/auth/set-pin", {
        phone_number: phone,
        pin: newPin,
      });

      setStep(3);
      setTimeout(() => navigate("/login"), 3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 font-sans">
      <main className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
        {step < 3 && (
          <Link
            to="/login"
            className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-6 transition-colors text-sm font-bold"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        )}

        <header className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            {step === 3 ? (
              <CheckCircle2 size={32} className="text-green-500" />
            ) : (
              <KeyRound size={28} />
            )}
          </div>
          <h1 className="text-2xl font-black text-[#0f172a]">
            {step === 1
              ? "Forgot PIN?"
              : step === 2
                ? "Verify OTP"
                : "PIN Reset Successfully"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1
              ? "Enter your phone to receive a reset code."
              : step === 2
                ? `Enter the code shown in the notification`
                : "You can now sign in with your new PIN."}
          </p>
        </header>

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <div className="relative">
              <Phone
                className="absolute left-4 top-3.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Phone number"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs font-bold text-center">
                {error}
              </p>
            )}
            <button
              disabled={loading}
              className="w-full bg-[#0f172a] text-white font-bold py-4 rounded-2xl text-sm hover:bg-black shadow-lg shadow-gray-200 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPin} className="flex flex-col gap-4">
            {/* OTP Input with View Toggle */}
            <div className="relative">
              <ShieldCheck
                className="absolute left-4 top-3.5 text-gray-400"
                size={18}
              />
              <input
                type={showOtp ? "text" : "password"} // Toggles visibility
                placeholder="6-Digit Code"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowOtp(!showOtp)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* New PIN Input with View Toggle */}
            <div className="relative">
              <Lock
                className="absolute left-4 top-3.5 text-gray-400"
                size={18}
              />
              <input
                type={showPin ? "text" : "password"} // Toggles visibility
                placeholder="Set New 4-6 Digit PIN"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold text-center">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? "Updating PIN..." : "Reset PIN"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center animate-bounce">
            <p className="text-blue-600 font-bold text-sm">
              Redirecting to login...
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResetPin;
