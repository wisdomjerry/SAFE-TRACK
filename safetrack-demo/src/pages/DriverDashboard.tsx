/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  AlertTriangle,
  Users,
  CheckCircle2,
  Moon,
  Sun,
  QrCode,
  Phone,
  Camera,
  Loader2,
  Navigation,
} from "lucide-react";
import axios from "axios";
import { useGpsBroadcaster } from "../hooks/useGpsBroadcaster";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { ShieldCheck } from "lucide-react";

const DriverDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tripActive, setTripActive] = useState(false);
  const [van, setVan] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const wakeLock = useRef<any>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [, setScannedToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [schoolName, setSchoolName] = useState<string>("");

  useGpsBroadcaster(van?.id, tripActive);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const name = localStorage.getItem("userName");
      const role = localStorage.getItem("userRole");

      setDriverInfo({ full_name: name, role: role });
      if (!token) return;

      const response = await axios.get(
        "https://safe-track-8a62.onrender.com/api/drivers/dashboard",
        { headers: { Authorization: `Bearer ${token.replace(/"/g, "")}` } },
      );

      if (response.data.success) {
        setVan(response.data.van);
        setStudents(response.data.students);
        setSchoolName(response.data.school_name || "SafeTrack Academy");
        setDriverInfo((prev: any) => ({
          ...prev,
          phone_number: response.data.van?.driver_phone || prev.phone_number,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    let interval: any;
    if (tripActive) {
      interval = setInterval(() => {
        fetchDashboardData();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [tripActive, fetchDashboardData]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Initial GPS Lock:", position.coords.latitude);
      },
      (error) => console.error(error),
      { enableHighAccuracy: true },
    );
  }, []);

  const startNativeScan = async () => {
    try {
      const status = await BarcodeScanner.checkPermissions();
      if (status.camera !== "granted")
        await BarcodeScanner.requestPermissions();
      document.body.classList.add("barcode-scanner-active");
      setIsScanning(true);
      const result = await BarcodeScanner.scan();
      await stopNativeScan();
      if (result?.barcodes?.length > 0) {
        const rawValue = result.barcodes?.[0]?.rawValue?.trim();
        if (!rawValue) return;
        const student = students.find(
          (s) => s.handover_token === rawValue || s.id?.toString() === rawValue,
        );
        if (student) {
          await performVerification(student, rawValue, "QR_SCAN", null);
        } else {
          alert(`Student not found.`);
        }
      }
    } catch (error) {
      await stopNativeScan();
    }
  };

  const stopNativeScan = async () => {
    document.body.classList.remove("barcode-scanner-active");
    await BarcodeScanner.stopScan();
    setIsScanning(false);
  };

  const toggleTrip = async () => {
    const newState = !tripActive;
    setTripActive(newState);
    if (newState && "wakeLock" in navigator) {
      try {
        wakeLock.current = await (navigator as any).wakeLock.request("screen");
      } catch (e) {
        /* empty */
      }
    } else if (wakeLock.current) {
      wakeLock.current.release();
      wakeLock.current = null;
    }
  };

  const handleVerify = (student: any) => {
    setSelectedStudent(student);
    setScannedToken(null);
    setPinInput("");
    setShowVerifyModal(true);
  };

  const performVerification = async (
    student: any,
    token: string | null,
    method: "QR_SCAN" | "MANUAL_PIN",
    pin: string | null = null,
  ) => {
    setIsVerifying(true);
    const action = student.status === "picked_up" ? "dropped_off" : "picked_up";
    try {
      const rawAuthToken = localStorage.getItem("authToken") || "";
      const cleanAuthToken = rawAuthToken.replace(/[\\"]/g, "").trim();
      const payload: any = {
        method,
        action,
        lat: van?.current_lat || null,
        lng: van?.current_lng || null,
      };
      if (method === "QR_SCAN") payload.scannedToken = token;
      else payload.pin = pin;

      await axios.post(
        `https://safe-track-8a62.onrender.com/api/drivers/students/${student.id}/verify`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${cleanAuthToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if ("vibrate" in navigator) navigator.vibrate(200);
      setShowVerifyModal(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        fetchDashboardData();
      }, 2500);
    } catch (err: any) {
      alert(err.response?.data?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const submitVerification = async () => {
    if (!pinInput || pinInput.length < 6) return;
    await performVerification(selectedStudent, null, "MANUAL_PIN", pinInput);
  };

  const stats = {
    pickedUp: students.filter((s) => s.status === "picked_up").length,
    pending: students.filter(
      (s) => s.status === "waiting" || s.status === "pending",
    ).length,
    absent: students.filter((s) => s.status === "absent").length,
    total: students.length || 1,
  };

  const theme = {
    bg: isDarkMode ? "bg-[#0F0F10]" : "bg-[#F4F7FA]",
    card: isDarkMode ? "bg-[#1C1C1E]" : "bg-white",
    textMain: isDarkMode ? "text-white" : "text-slate-900",
    textSub: isDarkMode ? "text-slate-400" : "text-slate-500",
    border: isDarkMode ? "border-white/5" : "border-slate-100",
    accent: "bg-blue-600",
  };

  const vanIcon = L.divIcon({
    className: "custom-icon",
    html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-blue-500 rounded-full animate-ping opacity-40"></div>
          <div class="absolute w-8 h-8 bg-blue-400 rounded-full animate-pulse opacity-20"></div>
          <div class="relative bg-blue-600 p-2.5 rounded-full border-4 border-white shadow-2xl text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

  function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng], 17);
    }, [lat, lng, map]);
    return null;
  }

  if (loading)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.textMain} font-black uppercase tracking-widest`}
      >
        Syncing Dashboard...
      </div>
    );

  return (
    <div
      className={`min-h-screen ${theme.bg} ${theme.textMain} transition-colors duration-300 pb-24`}
    >
      {/* PROFESSIONAL DRIVER HEADER */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* Brand Icon */}
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/30">
              <ShieldCheck size={18} className="text-white" />
            </div>

            <h2
              className={`text-xl font-black tracking-tighter ${theme.textMain} flex items-center gap-2`}
            >
              SAFETRACK
              <span className="bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded-md tracking-widest font-black">
                PRO
              </span>
            </h2>
          </div>

          {/* School Identity - Dynamically from state */}
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span
              className={`text-[10px] font-black ${theme.textSub} uppercase tracking-[0.2em]`}
            >
              {schoolName || "System Active"}
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2.5 rounded-2xl ${theme.card} border ${theme.border} shadow-xl active:scale-90 transition-all`}
        >
          {isDarkMode ? (
            <Sun size={20} className="text-amber-400" />
          ) : (
            <Moon size={20} className="text-blue-600" />
          )}
        </button>
      </header>

      <div className="px-5 space-y-6">
        {/* Driver Card */}
        <section
          className={`${theme.card} rounded-[2.5rem] p-6 border ${theme.border} shadow-xl`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={
                    driverInfo?.avatar_url || // Updated to use avatar_url
                    `https://ui-avatars.com/api/?name=${(driverInfo?.full_name || "Driver").replace(" ", "+")}&background=3b82f6&color=fff&bold=true`
                  }
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-600/20 transition-all hover:scale-105"
                  alt={driverInfo?.full_name || "Driver"}
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 ${
                    isDarkMode ? "border-[#1C1C1E]" : "border-white"
                  } rounded-full ${
                    tripActive ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight text-blue-600">
                  {driverInfo?.full_name}
                </h3>

                <div className="flex flex-col gap-0.5 mt-1">
                  <p
                    className={`text-[10px] ${theme.textSub} font-bold uppercase tracking-widest flex items-center gap-2`}
                  >
                    <span className="bg-blue-600/10 text-blue-600 px-1.5 py-0.5 rounded">
                      {van?.plate_number}
                    </span>
                    <span>•</span>
                    <span>Route {van?.id?.slice(0, 4)}</span>
                  </p>

                  {/* 🟢 DRIVER PHONE NUMBER SECTION */}
                  {driverInfo?.phone_number && (
                    <a
                      href={`tel:${driverInfo.phone_number}`}
                      className={`flex items-center gap-1.5 text-[11px] font-black mt-1 ${theme.textMain} hover:text-blue-600 transition-colors w-fit`}
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Phone size={10} className="text-emerald-600" />
                      </div>
                      {driverInfo.phone_number}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <span
              className={`${tripActive ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-current/20`}
            >
              {tripActive ? "Live" : "Idle"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleTrip}
              className={`flex items-center justify-center gap-2 ${tripActive ? "bg-rose-600" : "bg-blue-600"} text-white py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-900/20`}
            >
              {tripActive ? (
                "End Trip"
              ) : (
                <>
                  <Play size={18} fill="currentColor" /> Start Trip
                </>
              )}
            </button>
            <button
              className={`flex items-center justify-center gap-2 ${isDarkMode ? "bg-white/5" : "bg-slate-100"} py-4 rounded-2xl font-black text-amber-500 active:scale-95`}
            >
              <AlertTriangle size={18} /> Delay
            </button>
          </div>
        </section>

        {/* Live Map UI Fixed */}
        <section
          className={`${theme.card} rounded-[2.8rem] p-2 border ${theme.border} overflow-hidden shadow-2xl relative`}
        >
          <div className="absolute top-6 left-6 z-1000 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              Live GPS
            </span>
          </div>

          <button className="absolute bottom-6 right-6 z-1000 bg-blue-600 p-3 rounded-2xl text-white shadow-xl active:scale-90 transition-transform">
            <Navigation size={20} />
          </button>

          <div className="relative h-80 w-full rounded-[2.4rem] bg-slate-900 overflow-hidden border border-white/5">
            {van?.current_lat ? (
              <MapContainer
                key={van.id}
                center={[van.current_lat, van.current_lng]}
                zoom={17}
                zoomControl={false}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
              >
                <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
                <Marker
                  position={[van.current_lat, van.current_lng]}
                  icon={vanIcon}
                />
                <RecenterMap lat={van.current_lat} lng={van.current_lng} />
              </MapContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                <Loader2
                  className="animate-spin text-blue-600 mb-3"
                  size={32}
                />
                <p className="text-[10px] font-black uppercase text-slate-500">
                  Locking Satellite...
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section
          className={`${theme.card} rounded-4xl p-6 border ${theme.border}`}
        >
          <div className="flex justify-between items-end mb-4">
            <div>
              <p
                className={`text-[10px] font-black ${theme.textSub} uppercase tracking-widest mb-1`}
              >
                Attendance
              </p>
              <h2 className="text-3xl font-black">
                {stats.pickedUp}{" "}
                <span className={`${theme.textSub} text-xl`}>
                  / {stats.total}
                </span>
              </h2>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl ${isDarkMode ? "bg-blue-500/10" : "bg-blue-50"} flex items-center justify-center text-blue-500`}
            >
              <Users size={24} />
            </div>
          </div>
          <div
            className={`h-3 w-full ${isDarkMode ? "bg-white/5" : "bg-slate-100"} rounded-full overflow-hidden`}
          >
            <div
              className="h-full bg-linear-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000"
              style={{ width: `${(stats.pickedUp / stats.total) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-3 mt-6 gap-2">
            <StatBlock
              label="Picked"
              val={stats.pickedUp}
              color="text-emerald-500"
              dark={isDarkMode}
            />
            <StatBlock
              label="Waiting"
              val={stats.pending}
              color="text-amber-500"
              dark={isDarkMode}
            />
            <StatBlock
              label="Away"
              val={stats.absent}
              color="text-rose-500"
              dark={isDarkMode}
            />
          </div>
        </section>

        {/* Roster Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-lg tracking-tight">
              Student Roster
            </h3>
            <button
              onClick={startNativeScan}
              className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg active:scale-90 transition-transform"
            >
              <QrCode size={20} />
            </button>
          </div>
          <div className="space-y-3">
            {students.map((student) => (
              <StudentItem
                key={student.id}
                name={student.name}
                phone={student.parent_phone}
                status={student.status.replace("_", " ")}
                img={student.photo_url}
                theme={theme}
                color={
                  student.status === "picked_up"
                    ? "border-emerald-500"
                    : "border-amber-500"
                }
                isDone={student.status === "picked_up"}
                onAction={() => handleVerify(student)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Verification Modal */}
      {(showVerifyModal || isScanning) && (
        <div
          className={`fixed inset-0 z-10001 flex items-end ${isScanning ? "bg-transparent" : "bg-black/60 backdrop-blur-sm"} animate-in fade-in duration-300`}
        >
          <div
            className={`${theme.card} w-full rounded-t-[3.5rem] p-8 pb-14 shadow-2xl border-t ${theme.border} transform transition-transform duration-300 translate-y-0`}
          >
            <div className="w-16 h-1.5 bg-slate-700/20 rounded-full mx-auto mb-8" />
            {isScanning ? (
              <div className="space-y-8 text-center">
                <div className="relative aspect-square w-64 mx-auto rounded-[3rem] border-4 border-blue-500/50 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-[3rem] animate-pulse" />
                  <Camera size={48} className="text-blue-500/30" />
                </div>
                <button
                  onClick={stopNativeScan}
                  className="w-full py-5 bg-rose-500/10 text-rose-500 rounded-3xl font-black"
                >
                  Cancel Scanning
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                      Security Check
                    </span>
                    <h3 className="text-3xl font-black tracking-tight mt-1">
                      {selectedStudent?.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowVerifyModal(false);
                      startNativeScan();
                    }}
                    className="p-5 bg-blue-600 rounded-4xl text-white shadow-xl shadow-blue-600/20"
                  >
                    <QrCode size={28} />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) =>
                      setPinInput(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="000000"
                    className="w-full text-center text-6xl tracking-[0.15em] font-black py-8 rounded-[2.5rem] bg-slate-500/5 border-2 border-white/5 focus:border-blue-500 focus:bg-blue-500/5 outline-none transition-all"
                  />
                  <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Enter Parent's 6-Digit PIN
                  </p>
                </div>
                <button
                  onClick={submitVerification}
                  disabled={pinInput.length < 6 || isVerifying}
                  className={`w-full py-6 rounded-4xl font-black text-xl shadow-2xl transition-all ${pinInput.length === 6 ? "bg-blue-600 text-white shadow-blue-600/40" : "bg-slate-800 text-slate-600"}`}
                >
                  {isVerifying ? (
                    <Loader2 className="animate-spin mx-auto" />
                  ) : (
                    "Confirm Handover"
                  )}
                </button>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full text-slate-500 font-bold text-sm uppercase tracking-widest"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUCCESS SCREEN WITH STUDENT DATA */}
      {showSuccess && (
        <div className="fixed inset-0 z-20000 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500 px-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-sm p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] transform animate-in zoom-in-95 duration-300 text-center">
            {/* Pulsing Avatar Area */}
            <div className="relative flex justify-center mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-150" />
              <div className="relative">
                <img
                  src={
                    selectedStudent?.avatar_url ||
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                  }
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-xl"
                  alt="Verified"
                />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2 text-white border-4 border-white">
                  <CheckCircle2 size={24} strokeWidth={4} />
                </div>
              </div>
            </div>

            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-1 uppercase italic">
              Verified
            </h2>
            <h3 className="text-xl font-black text-blue-600 mb-2">
              {selectedStudent?.name}
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] bg-slate-100 py-2 px-4 rounded-full inline-block">
              Status Updated Successfully
            </p>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-tighter animate-pulse">
                Syncing with Cloud...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentItem = ({
  name,
  phone,
  status,
  img: avatarUrl,
  theme,
  color,
  isDone,
  onAction,
}: any) => (
  <div
    className={`${theme.card} p-4 rounded-4xl border ${theme.border} flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-1 rounded-full border-2 ${color} bg-slate-500/10`}>
        <img
          src={
            avatarUrl ||
            `https://ui-avatars.com/api/?name=${name.replace(" ", "+")}`
          }
          className="w-12 h-12 rounded-xl object-cover"
          alt="Student"
        />
      </div>
      <div>
        <h4 className="font-black text-sm tracking-tight">{name}</h4>
        <p
          className={`text-[10px] font-bold ${theme.textSub} uppercase tracking-tighter`}
        >
          {status}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <a
        href={`tel:${phone}`}
        className={`p-3 rounded-2xl ${theme.bg} text-blue-500 border ${theme.border}`}
      >
        <Phone size={18} />
      </a>
      <button
        onClick={onAction}
        className={`p-3 rounded-2xl ${isDone ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : theme.bg + " border " + theme.border + " " + theme.textSub}`}
      >
        {isDone ? (
          <CheckCircle2 size={18} strokeWidth={3} />
        ) : (
          <QrCode size={18} />
        )}
      </button>
    </div>
  </div>
);

const StatBlock = ({ label, val, color, dark }: any) => (
  <div
    className={`${dark ? "bg-white/5" : "bg-slate-50"} p-4 rounded-3xl text-center border border-white/5`}
  >
    <p className="text-[8px] font-black opacity-40 uppercase mb-1 tracking-widest">
      {label}
    </p>
    <p className={`text-lg font-black ${color}`}>{val}</p>
  </div>
);

export default DriverDashboard;
