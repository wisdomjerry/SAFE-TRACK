import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
// Added CheckCircle2 and MapPin to imports
import { School, Mail, Phone, Lock, Eye, EyeOff, MapPin, CheckCircle2 } from "lucide-react";

const SchoolRegistration = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    adminEmail: "",
    adminPhone: "",
    pin: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPin, setShowPin] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        school_name: formData.schoolName,
        school_email: formData.adminEmail,
        admin_name: formData.schoolName, 
        admin_email: formData.adminEmail,
        phone: formData.adminPhone,
        admin_pin: formData.pin,
        address: formData.location || "Not Provided",
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/school/register`,
        payload,
      );

      setIsSuccess(true); 

      setTimeout(() => {
        navigate("/login");
      }, 6000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Connection to server failed");
      setLoading(false); // Stop loading so user can try again
    }
  };

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl text-center border border-gray-100 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-black text-[#0f172a] mb-2">Registration Sent!</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            We've received the application for <span className="font-bold text-blue-600">{formData.schoolName}</span>. 
            Redirecting you to login...
          </p>
          <Link
            to="/login"
            className="block w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-sm hover:bg-blue-700 transition-all"
          >
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 font-sans">
      <main className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
        <header className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <School size={28} color="white" />
          </div>
          <h1 className="text-2xl font-black text-[#0f172a]">Register Institution</h1>
          <p className="text-gray-500 text-sm mt-1">Set up Safe Track for your school</p>
        </header>

        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <div className="relative">
            <School className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="School Name"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Admin Email Address"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Admin Phone Number"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Physical Address (City, Street)"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type={showPin ? "text" : "password"}
              placeholder="Set Admin PIN (4-6 digits)"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-600"
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-sm hover:bg-blue-700 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Submit Registration"}
          </button>
        </form>

        <footer className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-500">
            Already registered? <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default SchoolRegistration;