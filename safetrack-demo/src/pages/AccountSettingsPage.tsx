import {
  Bell,
  Lock,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  type LucideIcon,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import { useState } from "react";

// 1. Define the shape of a single setting item
interface SettingItem {
  icon: LucideIcon;
  label: string;
  desc: string;
  toggle?: "push" | "email" | "privacy";
}

// 2. Define the section structure
interface SettingSection {
  title: string;
  items: SettingItem[];
}

const SettingsPage = () => {
  const [toggles, setToggles] = useState({
    push: true,
    email: false,
    privacy: true,
  });

  // Inside the SettingsPage component...
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    // Simulate a network request to your backend
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSaving(false);
    setShowSavedMessage(true);

    // Hide success message after 3 seconds
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const handleToggle = (key: string | undefined) => {
    if (!key) return;
    const toggleKey = key as keyof typeof toggles;
    setToggles((prev) => ({
      ...prev,
      [toggleKey]: !prev[toggleKey],
    }));
  };

  // 3. EXPLICITLY TYPE THIS ARRAY to solve the error
  const sections: SettingSection[] = [
    {
      title: "App Settings",
      items: [
        {
          icon: Bell,
          label: "Push Notifications",
          desc: "Alerts for school activity",
          toggle: "push",
        },
        {
          icon: Smartphone,
          label: "Biometric Login",
          desc: "Use FaceID or Fingerprint",
          toggle: "privacy",
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          icon: Lock,
          label: "Change Password",
          desc: "Update your login credentials",
        },
        {
          icon: ShieldCheck,
          label: "Two-Factor Auth",
          desc: "Add extra layer of security",
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-4 mt-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Configure Safe Track to your needs.
        </p>
      </div>

      {sections.map((section, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {section.title}
          </h3>
          <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden mx-2 md:mx-0">
            {section.items.map((item, i) => {
              // This is now safe because item is typed as SettingItem
              const isToggle = !!item.toggle;
              const toggleKey = item.toggle as keyof typeof toggles;

              return (
                <div
                  key={i}
                  onClick={() => item.toggle && handleToggle(item.toggle)}
                  className="flex items-center justify-between p-5 hover:bg-slate-50/50 active:bg-slate-100 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                      <item.icon size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {isToggle ? (
                    <div
                      className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${
                        toggles[toggleKey] ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 transform ${
                          toggles[toggleKey] ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </div>
                  ) : (
                    <ChevronRight size={18} className="text-slate-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save Button Section */}
      <div className="px-2 md:px-0">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full py-4 rounded-3xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] ${
            showSavedMessage
              ? "bg-emerald-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } disabled:opacity-70`}
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving Changes...
            </>
          ) : showSavedMessage ? (
            <>
              <Check size={20} />
              Settings Saved!
            </>
          ) : (
            <>
              <Save size={20} />
              Save Configuration
            </>
          )}
        </button>

        {showSavedMessage && (
          <p className="text-center text-emerald-600 text-[10px] font-bold mt-3 animate-in fade-in slide-in-from-top-1">
            Your preferences have been synced to the cloud.
          </p>
        )}
      </div>

      <div className="mx-2 md:mx-0">
        <div className="p-6 bg-rose-50 rounded-4xl border border-rose-100">
          <p className="text-rose-600 font-bold text-sm">Danger Zone</p>
          <button className="mt-2 text-rose-500 text-xs font-black uppercase tracking-wider hover:underline transition-all">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
