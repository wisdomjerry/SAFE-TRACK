import React, { useState } from "react";
import axios from "axios";

interface PINSetupProps {
  phoneNumber: string;
  onPinSet: () => void;
}

const PINSetup: React.FC<PINSetupProps> = ({ phoneNumber, onPinSet }) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const savePin = async () => {
    if (pin.length !== 4) return setError("PIN must be 4 digits");
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(
        "https://safe-track-8a62.onrender.com/api/auth/set-pin",
        { phone_number: phoneNumber, pin }
      );
      if (data.success) onPinSet();
    } catch (err: any) {
      setError(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-8 p-6 bg-white rounded-2xl shadow-md">
      <h3 className="font-bold text-lg mb-4 text-slate-800">Set Your PIN</h3>
      <input
        type="password"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="w-full p-3 border rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="4-digit PIN"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <button
        onClick={savePin}
        disabled={loading}
        className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
      >
        {loading ? "Saving..." : "Save PIN"}
      </button>
    </div>
  );
};

export default PINSetup;
