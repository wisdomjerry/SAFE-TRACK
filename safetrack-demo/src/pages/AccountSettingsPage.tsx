import {
  Bell,
  Lock,
  Smartphone,
  ShieldCheck,
  Save,
  Check,
  Loader2,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios"; // Importing your active API instance
import { supabase } from "../config/supabaseClient";
import { NativeBiometric } from "capacitor-native-biometric";

const SettingsPage = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  /* ================= STATE ================= */

  // Sync toggles with localStorage so they "stick"
  const [toggles, setToggles] = useState({
    push: localStorage.getItem("pref_push") !== "false",
    biometric: localStorage.getItem("pref_biometric") === "true",
    twoFactor: localStorage.getItem("pref_2fa") === "true",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  /* ================= HANDLERS ================= */

  const handleToggle = async (key: "push" | "biometric" | "twoFactor") => {
    const newVal = !toggles[key];

    // 1. Get the Fresh ID from Supabase directly to avoid "undefined"
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || userData.id;

    if (!userId) {
      alert("User session not found. Please log in again.");
      return;
    }

    // --- NATIVE BIOMETRIC LOGIC ---
    if (key === "biometric" && newVal === true) {
      try {
        const result = await NativeBiometric.isAvailable();
        if (!result.isAvailable) {
          alert("Biometrics not supported on this device.");
          return;
        }

        await NativeBiometric.verifyIdentity({
          reason: "Confirm your identity to enable Biometric Login",
          title: "SafeTrack Security",
          subtitle: "Authenticate using your fingerprint or face",
          description: "This allows you to log in faster next time.",
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        console.log("User cancelled biometric check");
        return;
      }
    }

    // --- DATABASE UPDATE LOGIC ---
    // Optimistically update UI
    setToggles((prev) => ({ ...prev, [key]: newVal }));

    const columnMap = {
      push: "push_enabled",
      biometric: "biometric_enabled",
      twoFactor: "two_factor_enabled",
    };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [columnMap[key]]: newVal })
        .eq("id", userId); // Use the validated userId here

      if (error) throw error;

      localStorage.setItem(`pref_${key}`, String(newVal));
    } catch (err) {
      // Revert UI if DB fails
      setToggles((prev) => ({ ...prev, [key]: !newVal }));
      console.error("Supabase update failed:", err);
    }
  };

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const validatePassword = () => {
    if (passwords.newPass && passwords.newPass.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (passwords.newPass !== passwords.confirm) {
      return "New passwords do not match.";
    }
    return "";
  };

  const handleSave = async () => {
    const validationError = validatePassword();
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setPasswordError("");
    setIsSaving(true);

    try {
      // 1. REAL API CALL for password change (if fields are filled)
      if (passwords.current && passwords.newPass) {
        await api.put("/api/auth/update-password", {
          currentPassword: passwords.current,
          newPassword: passwords.newPass,
        });
      }

      // 2. Update toggle preferences on server (Optional)
      // await api.put("/api/auth/preferences", toggles);

      setShowSavedMessage(true);
      setPasswords({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setShowSavedMessage(false), 3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || "Failed to update settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you absolutely sure? This will permanently remove your profile data.",
    );

    if (confirmed) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id || userData.id;

        if (!userId) throw new Error("No User ID found");

        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (error) throw error;

        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = "/login";
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Could not delete account. Contact support.");
      }
    }
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-12 p-6 md:p-10 bg-slate-50 min-h-screen">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-100 transition"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Account Settings
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your security and notification preferences.
          </p>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-slate-100 p-8 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-800">Push Notifications</p>
              <p className="text-xs text-slate-500">
                Receive alerts for school activity
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggle("push")}
            className={`w-12 h-6 rounded-full flex items-center px-1 transition duration-300 ${
              toggles.push ? "bg-slate-900" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-sm transition transform duration-300 ${
                toggles.push ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-slate-100 p-8 space-y-8">
        <h2 className="text-lg font-semibold text-slate-900">Security</h2>

        {/* Change Password */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-slate-400" />
            <p className="font-medium text-slate-800">Change Password</p>
          </div>

          <div className="grid gap-4">
            {(["current", "newPass", "confirm"] as const).map((field) => (
              <div key={field} className="relative group">
                <input
                  // Switch between password and text
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    field === "current"
                      ? "Current Password"
                      : field === "newPass"
                        ? "New Password"
                        : "Confirm New Password"
                  }
                  // This ensures the input value is linked to state correctly
                  value={passwords[field]}
                  // This ensures typing actually updates the state
                  onChange={(e) => handlePasswordChange(field, e.target.value)}
                  className="w-full px-5 py-4 pr-12 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all text-sm outline-none"
                />

                {/* Eye Icon inside the input */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            ))}

            {passwordError && (
              <p className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-1">
                {passwordError}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition ml-2"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPassword ? "HIDE PASSWORDS" : "SHOW PASSWORDS"}
            </button>

            {passwordError && (
              <p className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                {passwordError}
              </p>
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-6 pt-6 border-t border-slate-50">
          <ToggleOption
            icon={<Smartphone size={20} />}
            title="Biometric Login"
            desc="Enable FaceID or fingerprint"
            active={toggles.biometric}
            onToggle={() => handleToggle("biometric")}
          />
          <ToggleOption
            icon={<ShieldCheck size={20} />}
            title="Two-Factor Authentication"
            desc="Extra protection for your account"
            active={toggles.twoFactor}
            onToggle={() => handleToggle("twoFactor")}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-6 px-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full py-5 rounded-3xl font-bold shadow-xl transition-all flex items-center justify-center gap-3 ${
            showSavedMessage
              ? "bg-emerald-500 text-white shadow-emerald-200"
              : "bg-slate-900 text-white hover:bg-black shadow-slate-200"
          } disabled:opacity-70`}
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" /> SAVING...
            </>
          ) : showSavedMessage ? (
            <>
              <Check size={18} /> SETTINGS UPDATED
            </>
          ) : (
            <>
              <Save size={18} /> SAVE CHANGES
            </>
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8">
        <h3 className="text-rose-600 font-bold uppercase tracking-widest text-xs">
          Danger Zone
        </h3>
        <p className="text-slate-500 text-xs mt-1">
          Once you delete your account, there is no going back.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="mt-4 px-6 py-3 bg-white border border-rose-200 text-rose-500 rounded-xl text-xs font-black hover:bg-rose-500 hover:text-white transition-all"
        >
          DELETE ACCOUNT
        </button>
      </div>
    </div>
  );
};

/* Helper Component for toggles */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ToggleOption = ({ icon, title, desc, active, onToggle }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-100 rounded-2xl text-slate-500">{icon}</div>
      <div>
        <p className="font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full flex items-center px-1 transition duration-300 ${active ? "bg-slate-900" : "bg-slate-300"}`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-sm transition transform duration-300 ${active ? "translate-x-6" : ""}`}
      />
    </button>
  </div>
);

export default SettingsPage;
