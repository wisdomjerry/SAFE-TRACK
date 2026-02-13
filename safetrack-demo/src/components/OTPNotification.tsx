import toast from "react-hot-toast";
import { ShieldCheck, Copy } from "lucide-react";


export const showOTPToast = (otp: string) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible
            ? "animate-in slide-in-from-right-full"
            : "animate-out fade-out"
        } max-w-sm w-full bg-[#0f172a] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-white/10 overflow-hidden border border-blue-500/30`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="shrink-0 pt-0.5">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                Security Verification
              </p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-2xl font-mono font-black tracking-[0.3em] text-white">
                  {otp}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(otp);
                    toast.success("Copied!");
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="mt-1 text-xs font-bold text-slate-500 italic">
                Valid for 5 minutes
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-white/5">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    ),
    { duration: 10000 }, // Your 10s auto-hide requirement
  );
};
