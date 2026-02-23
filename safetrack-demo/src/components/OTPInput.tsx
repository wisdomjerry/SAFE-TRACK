import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck } from "lucide-react";

interface OTPInputProps {
  phoneNumber: string;
  onVerified: () => void;
}

const OTPInput: React.FC<OTPInputProps> = ({ phoneNumber, onVerified }) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value.substring(element.value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        "https://safe-track-8a62.onrender.com/api/auth/verify-otp",
        { phone_number: phoneNumber, otp: otpString },
      );

      if (data.success) {
        toast.success("Identity Verified!");
        onVerified();
      } else {
        toast.error("Invalid OTP. Try again.");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
  // Keep the 'any' but cast it in the logic (Quickest fix)
  const error = err as { response?: { data?: { message?: string } } };
  toast.error(error.response?.data?.message || "Verification failed");
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 md:p-8 bg-white rounded-4xl shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="text-blue-600" size={24} />
        </div>
        <h3 className="font-black text-xl text-slate-900 tracking-tight">
          Verify Identity
        </h3>
        <p className="text-xs text-slate-500 mt-1 text-center">
          We sent a code to{" "}
          <span className="font-bold text-slate-700">{phoneNumber}</span>
        </p>
      </div>

      {/* SEGMENTED INPUTS */}
      <div className="flex justify-between gap-2 mb-6">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            ref={(el) => {
              if (el) inputRefs.current[index] = el;
            }}
            maxLength={1}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            inputMode="numeric"
            className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-black bg-gray-50 border-2 border-transparent rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800"
          />
        ))}
      </div>

      <button
        onClick={verifyOTP}
        disabled={loading || otp.join("").length < 6}
        className="w-full py-4 bg-[#0f172a] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          "Verify & Continue"
        )}
      </button>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            /* Add resend logic */
          }}
          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
        >
          Resend Code
        </button>
      </div>
    </div>
  );
};

export default OTPInput;
