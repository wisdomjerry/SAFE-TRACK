// src/pages/super-admin/SettingsPage.tsx
import  { useState } from 'react';
import { Save, Shield, Bell, Globe, Database, Sliders } from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 text-sm">Configure global platform parameters and security protocols.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 space-y-2">
          <TabButton 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')} 
            icon={<Globe size={18} />} 
            label="General" 
          />
          <TabButton 
            active={activeTab === 'security'} 
            onClick={() => setActiveTab('security')} 
            icon={<Shield size={18} />} 
            label="Security & Auth" 
          />
          <TabButton 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')} 
            icon={<Bell size={18} />} 
            label="Notifications" 
          />
          <TabButton 
            active={activeTab === 'system'} 
            onClick={() => setActiveTab('system')} 
            icon={<Database size={18} />} 
            label="System Health" 
          />
        </div>

        {/* Settings Form Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="text-blue-600" size={20} /> Platform Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Platform Name" placeholder="Safe Track Pro" />
                <InputGroup label="Support Email" placeholder="admin@safetrack.com" />
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-semibold text-slate-700 mb-4">Maintenance Mode</h4>
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div>
                    <p className="text-amber-800 font-medium">Disable Public Access</p>
                    <p className="text-amber-600 text-xs">This will prevent all users except Super Admins from logging in.</p>
                  </div>
                  <ToggleButton />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-800">Security Protocols</h3>
              <InputGroup label="JWT Secret Key" placeholder="••••••••••••••••" type="password" />
              <InputGroup label="Token Expiry (Hours)" placeholder="24" type="number" />
              
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <p className="font-medium text-slate-700">Enforce Two-Factor Authentication</p>
                <ToggleButton />
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25">
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
      active 
        ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm" 
        : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    {icon} {label}
  </button>
);

const InputGroup = ({ label, placeholder, type = "text" }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-600"
    />
  </div>
);

const ToggleButton = () => (
  <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer hover:bg-slate-300 transition-colors">
    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm" />
  </div>
);

export default SettingsPage;