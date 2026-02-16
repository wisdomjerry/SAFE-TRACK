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
} from "lucide-react";
import { useState } from "react";

const SettingsPage = () => {
  /* ================= STATE ================= */

  const [toggles, setToggles] = useState({
    push: true,
    biometric: false,
    twoFactor: true,
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

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const validatePassword = () => {
    if (passwords.newPass.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (passwords.newPass !== passwords.confirm) {
      return "Passwords do not match.";
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

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSaving(false);
    setShowSavedMessage(true);

    setTimeout(() => setShowSavedMessage(false), 3000);

    setPasswords({ current: "", newPass: "", confirm: "" });
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-12 p-6 md:p-10 bg-slate-50">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Manage your security, authentication and preferences.
        </p>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-slate-100 p-8 space-y-6">

        <h2 className="text-lg font-semibold text-slate-900">
          Notifications
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bell className="text-slate-400" size={20} />
            <div>
              <p className="font-medium text-slate-800">Push Notifications</p>
              <p className="text-xs text-slate-500">
                Receive alerts for school activity
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggle("push")}
            className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
              toggles.push ? "bg-slate-900" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition ${
                toggles.push ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-slate-100 p-8 space-y-8">

        <h2 className="text-lg font-semibold text-slate-900">
          Security
        </h2>

        {/* Change Password */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-slate-400" />
            <p className="font-medium text-slate-800">
              Change Password
            </p>
          </div>

          <div className="grid gap-4">
            {["current", "newPass", "confirm"].map((field, idx) => (
              <div key={idx} className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    field === "current"
                      ? "Current Password"
                      : field === "newPass"
                      ? "New Password"
                      : "Confirm New Password"
                  }
                  value={passwords[field as keyof typeof passwords]}
                  onChange={(e) =>
                    handlePasswordChange(field, e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-2 text-xs text-slate-500"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPassword ? "Hide Passwords" : "Show Passwords"}
            </button>

            {passwordError && (
              <p className="text-rose-500 text-xs font-medium">
                {passwordError}
              </p>
            )}
          </div>
        </div>

        {/* Biometric Toggle */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <Smartphone className="text-slate-400" size={20} />
            <div>
              <p className="font-medium text-slate-800">
                Biometric Login
              </p>
              <p className="text-xs text-slate-500">
                Enable FaceID or fingerprint
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggle("biometric")}
            className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
              toggles.biometric ? "bg-slate-900" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition ${
                toggles.biometric ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {/* Two Factor Toggle */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <ShieldCheck className="text-slate-400" size={20} />
            <div>
              <p className="font-medium text-slate-800">
                Two-Factor Authentication
              </p>
              <p className="text-xs text-slate-500">
                Extra protection for your account
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggle("twoFactor")}
            className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
              toggles.twoFactor ? "bg-slate-900" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition ${
                toggles.twoFactor ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3 ${
          showSavedMessage
            ? "bg-emerald-500 text-white"
            : "bg-slate-900 text-white hover:bg-slate-800"
        } disabled:opacity-70`}
      >
        {isSaving ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Saving...
          </>
        ) : showSavedMessage ? (
          <>
            <Check size={18} />
            Settings Saved
          </>
        ) : (
          <>
            <Save size={18} />
            Save Changes
          </>
        )}
      </button>

      {/* Danger Zone */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
        <p className="text-rose-600 font-semibold">Danger Zone</p>
        <button className="mt-2 text-rose-500 text-sm font-medium hover:underline">
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
