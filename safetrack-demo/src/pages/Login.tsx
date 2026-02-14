import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast"; // 1. Import toast
import { showOTPToast } from "../components/OTPNotification"; // 2. Import your helper
import {
  ShieldCheck,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserCircle2,
  Mail,
  Loader2,
} from "lucide-react";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state

  const [otpSent, setOtpSent] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const [savedUser, setSavedUser] = useState<{
    name: string;
    role: string;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (otpSent && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [otpSent]);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");
    if (name && role) setSavedUser({ name, role });
  }, []);

  const handleRequestOtp = async () => {
    if (!identifier) return;
    setError("");
    setLoading(true);

    if (identifier.includes("@")) {
      setOtpSent(true);
      setIsFirstTime(false);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        "https://safe-track-8a62.onrender.com/api/auth/start-otp",
        { phone_number: identifier },
      );

      if (res.data.step === "ENTER_PIN") {
        setIsFirstTime(false);
        setOtpSent(true);
      } else if (res.data.step === "VERIFY_OTP") {
        // 🚀 TRIGGER TOAST INSTEAD OF LOCAL STATE
        if (res.data.dev_otp) {
          showOTPToast(res.data.dev_otp);
        }
        setIsFirstTime(true);
        setOtpSent(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "User not found");
      toast.error("Account lookup failed"); // Feedback for mobile users
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res;
      if (isFirstTime) {
        res = await axios.post(
          "https://safe-track-8a62.onrender.com/api/auth/set-pin",
          { phone_number: identifier, pin },
        );
      } else {
        res = await axios.post(
          "https://safe-track-8a62.onrender.com/api/auth/unified-login",
          { identifier, pin },
        );
      }

      if (res.data.success) {
        toast.success("Login Successful!");
        const { token, role, data } = res.data;

        localStorage.setItem("authToken", token);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", data.name || data.full_name);

        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const routeMap: Record<string, string> = {
          SUPER_ADMIN: "/admin",
          SCHOOL_ADMIN: "/school",
          DRIVER: "/driver",
          PARENT: "/parent",
        };

        navigate(routeMap[role] || "/");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid Credentials");
      toast.error("Check your PIN and try again");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickOpen = () => {
    const token = localStorage.getItem("authToken");

    // Now we 'read' it by checking its length
    if (savedUser && token && token.length > 0) {
      const routeMap: Record<string, string> = {
        SUPER_ADMIN: "/admin",
        SCHOOL_ADMIN: "/school",
        DRIVER: "/driver",
        PARENT: "/parent",
      };
      navigate(routeMap[savedUser.role] || "/");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center px-6 font-sans text-[#1d1c1d]">
      <main className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100">
        <header className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#3b82f6] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transition-transform hover:scale-110">
            <ShieldCheck size={32} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[#0f172a]">
            SafeTrack
          </h1>
        </header>

        {savedUser && !otpSent && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-4">
              Welcome Back
            </p>
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-blue-300 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <UserCircle2 size={24} />
                </div>
                <div className="max-w-30">
                  <h3 className="font-bold text-[#0f172a] text-sm leading-tight truncate">
                    {savedUser.name}
                  </h3>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">
                    {savedUser.role.replace("_", " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleQuickOpen}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-[#0f172a] transition-all shadow-md shadow-blue-200"
              >
                Open <ArrowRight size={14} />
              </button>
            </div>

            <div className="relative flex py-8 items-center">
              <div className="grow border-t border-gray-100"></div>
              <span className="shrink mx-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                New Session
              </span>
              <div className="grow border-t border-gray-100"></div>
            </div>
          </div>
        )}

        {!otpSent ? (
          <div className="flex flex-col gap-5">
            <div className="relative group">
              <span className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                {identifier.includes("@") ? (
                  <Mail size={18} />
                ) : (
                  <Phone size={18} />
                )}
              </span>
              <input
                type="text"
                placeholder="Email or Phone number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[16px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-400 placeholder:font-medium"
                required
              />
            </div>

            <button
              type="button"
              disabled={loading || !identifier}
              onClick={handleRequestOtp}
              className="w-full py-4 bg-[#0f172a] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : identifier.includes("@") ? (
                "Next"
              ) : (
                "Continue"
              )}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="text-center mb-2">
              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                {isFirstTime ? "Create Your PIN" : "Enter Security PIN"}
              </h2>
              <p className="text-[10px] text-blue-600 font-bold bg-blue-50 inline-block px-3 py-1 rounded-full">
                {identifier}
              </p>
            </div>

            <div className="relative group">
              <span className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </span>

              <input
                ref={pinInputRef}
                type={showPin ? "text" : "password"}
                placeholder={isFirstTime ? "Choose 4-Digit PIN" : "4-Digit PIN"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                inputMode="numeric"
                maxLength={identifier.includes("@") ? 20 : 4}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[16px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 transition-all tracking-[0.5em] font-black"
                required
              />

              <button
                type="button"
                onClick={() => setShowPin((prev) => !prev)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-600 transition p-1"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                <p className="text-rose-600 text-[11px] font-bold text-center">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-[#0f172a] text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isFirstTime ? (
                "Activate Account"
              ) : (
                "Sign In"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setIsFirstTime(false);
                setPin("");
              }}
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              ← Use different account
            </button>
          </form>
        )}

        <footer className="mt-8 text-center space-y-4">
          <p className="text-xs text-gray-400 font-bold">
            Forgot your PIN?{" "}
            <Link to="/reset-pin" className="text-blue-600 hover:underline">
              Reset
            </Link>
          </p>

          <div className="pt-6 border-t border-gray-50">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              New School?{" "}
              <Link
                to="/register-school"
                className="text-[#0f172a] hover:underline"
              >
                Register Institution
              </Link>
            </p>
          </div>
        </footer>
      </main>

      <footer className="mt-10 flex gap-8 text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">
        <Link to="/security" className="hover:text-blue-500 transition-colors">
          Security
        </Link>
        <Link to="/privacy" className="hover:text-blue-500 transition-colors">
          Privacy
        </Link>
        <Link to="/contact" className="hover:text-blue-500 transition-colors">
          Support
        </Link>
      </footer>
    </div>
  );
};

export default Login;
