import { useCallback, useEffect, useState } from "react";
import axios from "../api/axios";
import { useUser } from "../hooks/useUser";
import { useGpsBroadcaster } from "../hooks/useGpsBroadcaster";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  QrCode,
  X,
  Users,
  Bus,
  Navigation,
  ArrowRightCircle,
} from "lucide-react";

const DriverDashboard = () => {
  useUser();
  const [students, setStudents] = useState<any[]>([]);
  const [van, setVan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [verifyingStudent, setVerifyingStudent] = useState<any>(null);
  const [verificationMode, setVerificationMode] = useState<"picked_up" | "dropped_off">("picked_up");

  // Broadcast GPS location while tracking
  useGpsBroadcaster(van?.id, isTracking);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await axios.get("/api/drivers/dashboard");
      if (res.data.success) {
        setStudents(res.data.students || []);
        setVan(res.data.van || null);
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Secure student verification
  const handleSecureVerify = async (
    studentId: string,
    pin?: string,
    method: "PIN" | "QR" = "PIN",
    overrideAction?: "picked_up" | "dropped_off"
  ) => {
    const action = overrideAction || verificationMode;

    const executeVerification = async (lat: number | null = null, lng: number | null = null) => {
      try {
        const res = await axios.post(`/api/drivers/students/${studentId}/verify`, {
          pin,
          method,
          action,
          lat,
          lng,
        });
        if (res.data.success) {
          setStudents(prev =>
            prev.map(s =>
              s.id === studentId
                ? { ...s, is_on_bus: action === "picked_up", status: action }
                : s
            )
          );
          setVerifyingStudent(null);
          fetchDashboardData();
        }
      } catch (err: any) {
        alert(err.response?.data?.message || "Verification failed. Please try again.");
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => executeVerification(pos.coords.latitude, pos.coords.longitude),
        () => executeVerification(),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      executeVerification();
    }
  };

  // Finish route
  const finishRoute = async () => {
    const remaining = students.filter(s => s.is_on_bus).length;
    if (remaining > 0) {
      alert(`⚠️ Safety Alert: ${remaining} students still on the bus!`);
      return;
    }
    if (window.confirm("Complete route and reset van status?")) {
      try {
        await axios.post("/api/drivers/route/finish");
        setIsTracking(false);
        setStudents([]);
        alert("Route finalized.");
      } catch (err) {
        console.error("Finish route error:", err);
      }
    }
  };

  // Counts
  const onboardCount = students.filter(s => s.is_on_bus).length;
  const waitingCount = students.filter(s => !s.is_on_bus && s.status !== "dropped_off").length;
  const finishedCount = students.filter(s => s.status === "dropped_off").length;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
          Syncing Fleet...
        </p>
      </div>
    );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50/50 pb-24 font-sans antialiased">
      {/* Vehicle Header */}
      <div
        className={`relative pt-14 pb-12 px-8 transition-colors duration-500 rounded-b-[2.5rem] shadow-2xl shadow-blue-100 ${
          isTracking ? "bg-gray-900" : "bg-blue-600"
        }`}
      >
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h2 className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em]">
              Vehicle Active
            </h2>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              {van?.model || "Fleet Unit"}
            </h1>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md">
              <span className="text-white/80 text-[10px] font-mono font-bold tracking-tighter">
                {van?.plate_number}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <Navigation className="text-white" size={20} />
          </div>
        </div>

        {/* Vehicle Stats */}
        <div className="grid grid-cols-2 gap-4">
          <InfoCard icon={<Users size={12} />} label="On Board" value={onboardCount} />
          <InfoCard
            icon={<MapPin size={12} />}
            label={waitingCount > 0 ? "To Pickup" : "Dropped"}
            value={waitingCount > 0 ? waitingCount : finishedCount}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-4xl p-3 shadow-xl shadow-gray-200/50 flex gap-3">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`flex-3 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all transform active:scale-95 ${
              isTracking
                ? "bg-gray-100 text-gray-900"
                : "bg-blue-600 text-white shadow-lg shadow-blue-200"
            }`}
          >
            {isTracking ? (
              <>
                <Square size={16} className="fill-current" /> END ROUTE
              </>
            ) : (
              <>
                <Play size={16} className="fill-current" /> START SHIFT
              </>
            )}
          </button>
          <button className="flex-1 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={20} />
          </button>
        </div>
      </div>

      {/* Drop-off Phase Button */}
      {waitingCount === 0 && onboardCount > 0 && (
        <div className="px-8 mb-8 animate-in slide-in-from-top duration-500">
          <button className="w-full bg-emerald-500 text-white p-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all">
            <ArrowRightCircle size={20} />
            Begin Drop-off Phase
          </button>
        </div>
      )}

      {/* Live Manifest */}
      <div className="px-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">
            Live Manifest
          </h3>
          <div className="h-px flex-1 mx-4 bg-gray-100"></div>
          <span className="text-[10px] font-bold text-gray-400">{students.length} PAX</span>
        </div>

        <div className="space-y-4">
          {students.map(student => (
            <StudentActionCard
              key={student.id}
              student={student}
              onVerifyPickup={() => {
                setVerificationMode("picked_up");
                setVerifyingStudent(student);
              }}
              onVerifyDropoff={() => {
                setVerificationMode("dropped_off");
                setVerifyingStudent(student);
              }}
            />
          ))}
          {students.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-300">
                <Bus size={32} />
              </div>
              <p className="text-gray-400 text-sm font-medium">No passengers assigned today.</p>
            </div>
          )}
        </div>
      </div>

      {/* Complete Route Button */}
      {students.length > 0 && waitingCount === 0 && onboardCount === 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-8">
          <button
            onClick={finishRoute}
            className="w-full py-5 bg-gray-900 text-white rounded-4xl font-bold shadow-2xl flex items-center justify-center gap-3 transform hover:-translate-y-1 transition-all"
          >
            COMPLETE MISSION 🏁
          </button>
        </div>
      )}

      {/* Verification Modal */}
      {verifyingStudent && (
        <VerificationModal
          student={verifyingStudent}
          mode={verificationMode}
          onClose={() => setVerifyingStudent(null)}
          onVerify={(pin: string) => handleSecureVerify(verifyingStudent.id, pin, "PIN")}
          onQrSuccess={(decodedText: string) => {
            if (decodedText.includes(`ID:${verifyingStudent.id}`)) {
              const scannedPin = decodedText.split("PIN:")[1]?.split("|")[0];
              let detectedAction: any = verificationMode;
              if (decodedText.includes("ACTION:dropped_off")) detectedAction = "dropped_off";
              if (decodedText.includes("ACTION:picked_up")) detectedAction = "picked_up";
              handleSecureVerify(verifyingStudent.id, scannedPin, "QR", detectedAction);
            } else alert("Invalid QR for this student!");
          }}
        />
      )}
    </div>
  );
};

// --- Reusable Components ---
const InfoCard = ({ icon, label, value }: any) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-4">
    <div className="flex items-center gap-2 text-blue-200 mb-1">{icon}<span className="text-[9px] font-bold uppercase tracking-wider">{label}</span></div>
    <p className="text-3xl font-light text-white">{value}</p>
  </div>
);

const StudentActionCard = ({ student, onVerifyPickup, onVerifyDropoff }: any) => {
  const isOnBus = student.is_on_bus;
  const isArrived = student.status === "dropped_off";
  return (
    <div className={`group relative p-5 rounded-4xl transition-all duration-300 ${
      isOnBus ? "bg-blue-600 shadow-xl shadow-blue-100 translate-x-1" : isArrived ? "bg-emerald-50 border border-emerald-100" : "bg-white shadow-sm border border-gray-100"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
            isOnBus ? "bg-white/20 text-white" : isArrived ? "bg-emerald-100 text-emerald-600" : "bg-gray-50 text-gray-400"
          }`}>{student.name.charAt(0)}</div>
          <div>
            <h4 className={`font-bold tracking-tight ${isOnBus ? "text-white" : "text-gray-800"}`}>{student.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnBus ? "bg-blue-200 animate-pulse" : isArrived ? "bg-emerald-400" : "bg-amber-400"}`}></div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isOnBus ? "text-blue-100" : isArrived ? "text-emerald-600" : "text-gray-400"}`}>
                {isOnBus ? "In Transit" : isArrived ? "Securely Dropped" : "Ready for Pickup"}
              </span>
            </div>
          </div>
        </div>

        {!isArrived ? (
          <button onClick={isOnBus ? onVerifyDropoff : onVerifyPickup} className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-90 ${
            isOnBus ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/20" : "bg-blue-50 text-blue-600"
          }`}>
            <QrCode size={18} />
            <span className="text-[8px] font-bold uppercase tracking-tighter">{isOnBus ? "Dropoff" : "Pickup"}</span>
          </button>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 size={18} />
          </div>
        )}
      </div>
    </div>
  );
};

const VerificationModal = ({ student, mode, onClose, onVerify, onQrSuccess }: any) => {
  const [pin, setPin] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!showScanner) return;
    const scanner = new Html5QrcodeScanner("reader", { fps: 15, qrbox: 250 }, false);
    scanner.render(
      (text) => { onQrSuccess(text); scanner.clear(); },
      () => {}
    );
    return () => { scanner.clear().catch(() => {}); };
  }, [showScanner]);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-100 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${mode === "picked_up" ? "bg-blue-600" : "bg-emerald-500"}`}></div>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-900"><X size={20} /></button>

        <div className="text-center mt-4 mb-8">
          <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${mode === 'picked_up' ? 'text-blue-600' : 'text-emerald-600'}`}>Security Verification</h2>
          <h3 className="text-2xl font-bold text-gray-900 leading-none">{student.name}</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Verify {mode === "picked_up" ? "Entry" : "Handover"}</p>
        </div>

        {showScanner ? (
          <div className="rounded-4xl overflow-hidden border-4 border-gray-50 bg-gray-50 aspect-square mb-6">
            <div id="reader"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className={`w-full text-4xl text-center font-light tracking-[0.4em] py-8 bg-gray-50 rounded-4xl border-none outline-none transition-all focus:ring-2 ${mode === 'picked_up' ? 'focus:ring-blue-600/20' : 'focus:ring-emerald-600/20'}`}
              placeholder="000000"
            />
            <button
              onClick={() => onVerify(pin)}
              disabled={pin.length !== 6}
              className={`w-full py-5 rounded-2xl font-bold shadow-xl transition-all ${
                pin.length === 6 ? mode === 'picked_up' ? "bg-blue-600 text-white shadow-blue-200" : "bg-emerald-600 text-white shadow-emerald-200" : "bg-gray-100 text-gray-300"
              }`}
            >
              VALIDATE PIN
            </button>
          </div>
        )}

        <button
          onClick={() => setShowScanner(!showScanner)}
          className={`w-full mt-8 flex items-center justify-center gap-2 transition-colors font-bold text-[10px] uppercase tracking-widest ${showScanner ? "text-gray-400" : mode === 'picked_up' ? "text-blue-600" : "text-emerald-600"}`}
        >
          {showScanner ? "Enter PIN Manually" : <>
            <QrCode size={14} /> Use Guardian QR
          </>}
        </button>
      </div>
    </div>
  );
};

export default DriverDashboard;
