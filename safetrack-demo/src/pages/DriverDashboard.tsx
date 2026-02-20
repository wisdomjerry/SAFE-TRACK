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
} from "lucide-react";
import axios from "axios";
import { useGpsBroadcaster } from "../hooks/useGpsBroadcaster";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// Removed BrowserMultiFormatReader as we are using native MLKit
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

const DriverDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tripActive, setTripActive] = useState(false);
  const [van, setVan] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const wakeLock = useRef<any>(null);

  // NEW: Verification States
  const [isScanning, setIsScanning] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useGpsBroadcaster(van?.id, tripActive);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const name = localStorage.getItem("userName");
      const role = localStorage.getItem("userRole");

      setDriverInfo({
        full_name: name,
        role: role,
      });

      if (!token) return;

      const response = await axios.get(
        "https://safe-track-8a62.onrender.com/api/drivers/dashboard",
        { headers: { Authorization: `Bearer ${token.replace(/"/g, "")}` } },
      );

      if (response.data.success) {
        setVan(response.data.van);
        setStudents(response.data.students);

        // Removed .catch() because state updates are synchronous
        // and don't return a promise.
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

  // Add this near your other useEffects
  useEffect(() => {
    // Get immediate location on load so the map isn't "stuck" in the past
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // If we don't have van data yet, or it's old,
        // we can use this to center the map initially
        console.log("Initial GPS Lock:", latitude, longitude);
      },
      (error) => console.error("Initial GPS Error:", error),
      { enableHighAccuracy: true },
    );
  }, []);

  // REWRITTEN: Native Barcode Scanner Logic with correct property access
  const startNativeScan = async () => {
    try {
      const status = await BarcodeScanner.checkPermissions();
      if (status.camera !== "granted")
        await BarcodeScanner.requestPermissions();

      document.body.classList.add("barcode-scanner-active");
      setIsScanning(true);

      const result = await BarcodeScanner.scan();
      await stopNativeScan(); // Hide camera overlay

      if (result?.barcodes?.length > 0) {
        const rawValue = result.barcodes?.[0]?.rawValue?.trim();
        if (!rawValue) return;

        console.log("SUCCESSFULLY SCANNED:", rawValue);

        const student = students.find(
          (s) =>
            s.handover_token === rawValue ||
            s.id?.toString() === rawValue ||
            s.student_id?.toString() === rawValue,
        );

        if (student) {
          console.log("MATCH FOUND, AUTO-VERIFYING:", student.name);
          // We pass data directly to avoid waiting for React state updates
          await performVerification(student, student.handover_token, "QR_SCAN");
        } else {
          alert(`Student not found in your current trip roster.`);
        }
      }
    } catch (error) {
      console.error("SCAN ERROR:", error);
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
    pin: string = "000000",
  ) => {
    setIsVerifying(true);
    const action = student.status === "picked_up" ? "dropped_off" : "picked_up";

    try {
      const authToken = localStorage.getItem("authToken");
      await axios.post(
        `https://safe-track-8a62.onrender.com/api/drivers/students/${student.id}/verify`,
        {
          pin: pin,
          scannedToken: token,
          method: method,
          action,
          lat: van?.current_lat || null,
          lng: van?.current_lng || null,
        },
        {
          headers: { Authorization: `Bearer ${authToken?.replace(/"/g, "")}` },
        },
      );

      // Success Actions
      if ("vibrate" in navigator) navigator.vibrate(200);

      setShowVerifyModal(false); // Close PIN modal if it was open
      setPinInput("");
      setShowSuccess(true); // Show big green checkmark

      // Auto-refresh and hide success UI
      setTimeout(() => {
        setShowSuccess(false);
        fetchDashboardData();
      }, 2000);
    } catch (err: any) {
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      alert(err.response?.data?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // 3. Updated Manual PIN Submission
  const submitVerification = async () => {
    if (!pinInput || pinInput.length < 6) {
      alert("Please enter the 6-digit PIN.");
      return;
    }
    // Call the shared function
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

  const icon = L.divIcon({
    className: "custom-icon",
    html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          <div class="relative bg-blue-600 p-2 rounded-full border-2 border-white shadow-xl text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng], map.getZoom());
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
      <header className="px-6 pt-12 pb-4 flex justify-between items-center">
        <h2 className="text-xl font-black tracking-tight">Trip Details</h2>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-xl ${theme.card} border ${theme.border} shadow-sm`}
        >
          {isDarkMode ? (
            <Sun size={20} className="text-amber-400" />
          ) : (
            <Moon size={20} className="text-blue-600" />
          )}
        </button>
      </header>

      <div className="px-5 space-y-6">
        {/* Driver Card Section */}
        <section
          className={`${theme.card} rounded-4xl p-6 border ${theme.border} shadow-xl`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={
                    driverInfo?.photo_url ||
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                  }
                  className="w-14 h-14 rounded-2xl object-cover"
                  alt="Driver"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#1C1C1E] rounded-full ${tripActive ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}
                />
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight">
                  {driverInfo?.full_name || "Driver Name"}
                </h3>
                <p className={`text-xs ${theme.textSub} font-bold mt-0.5`}>
                  {driverInfo?.phone_number || "No Phone linked"}
                </p>
                <p
                  className={`text-[10px] ${theme.textSub} font-medium opacity-70 uppercase tracking-tighter mt-1`}
                >
                  Bus {van?.plate_number || "N/A"} • Route #{" "}
                  {van?.id?.slice(0, 3) || "---"}
                </p>
              </div>
            </div>
            <span
              className={`${tripActive ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest`}
            >
              {tripActive ? "Active" : "Idle"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleTrip}
              className={`flex items-center justify-center gap-2 ${tripActive ? "bg-rose-600" : "bg-blue-600"} text-white py-4 rounded-2xl font-black transition-transform active:scale-95 shadow-lg`}
            >
              {tripActive ? (
                "Stop Trip"
              ) : (
                <>
                  <Play size={18} fill="currentColor" /> Start Trip
                </>
              )}
            </button>
            <button
              className={`flex items-center justify-center gap-2 ${isDarkMode ? "bg-white/5" : "bg-slate-100"} py-4 rounded-2xl font-black text-amber-500`}
            >
              <AlertTriangle size={18} /> Report Delay
            </button>
          </div>
        </section>

        {/* Map Section */}
        <section
          className={`${theme.card} rounded-[2.5rem] p-2 border ${theme.border} overflow-hidden shadow-lg`}
        >
          <div className="relative h-96 w-full rounded-[2.2rem] bg-slate-800 overflow-hidden border border-white/5">
            {van?.current_lat && van?.current_lng ? (
              <MapContainer
                // Use key to force map to re-mount if van ID changes,
                // ensuring we don't get stuck on old coordinates.
                key={van.id}
                center={[van.current_lat, van.current_lng]}
                zoom={17}
                zoomControl={false}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri"
                />
                <TileLayer
                  url={
                    isDarkMode
                      ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                      : "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                  }
                />

                {/* The Van Marker */}
                <Marker
                  position={[van.current_lat, van.current_lng]}
                  icon={icon}
                />

                {/* This component forces the map to follow the blue dot */}
                <RecenterMap lat={van.current_lat} lng={van.current_lng} />
              </MapContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-[10px] font-black uppercase text-slate-500">
                  Waiting for GPS Signal...
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
                Students Onboard
              </p>
              <h2 className="text-3xl font-black">
                {stats.pickedUp}{" "}
                <span className={`${theme.textSub} text-xl`}>
                  / {stats.total}
                </span>
              </h2>
            </div>
            <div
              className={`w-10 h-10 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-blue-50"} flex items-center justify-center text-blue-500`}
            >
              <Users size={20} />
            </div>
          </div>
          <div
            className={`h-2 w-full ${isDarkMode ? "bg-white/5" : "bg-slate-100"} rounded-full overflow-hidden`}
          >
            <div
              className="h-full bg-linear-to-r from-blue-600 to-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${(stats.pickedUp / stats.total) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-3 mt-6 gap-2">
            <StatBlock
              label="Picked Up"
              val={stats.pickedUp}
              color="text-emerald-500"
              dark={isDarkMode}
            />
            <StatBlock
              label="Pending"
              val={stats.pending}
              color="text-amber-500"
              dark={isDarkMode}
            />
            <StatBlock
              label="Absent"
              val={stats.absent}
              color="text-rose-500"
              dark={isDarkMode}
            />
          </div>
        </section>

        {/* Roster Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-lg">Student Roster</h3>
            <button
              onClick={startNativeScan}
              className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"
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
                img={
                  student.photo_url ||
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                }
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

      {/* NEW: MOBILE SCANNER & PIN MODAL (UPDATED FOR NATIVE & 6 DIGITS) */}
      {(showVerifyModal || isScanning) && (
        <div
          className={`fixed inset-0 z-9999 flex items-end ${isScanning ? "bg-transparent" : "bg-black/80"} backdrop-blur-md animate-in fade-in duration-200`}
        >
          <div
            className={`${theme.card} w-full rounded-t-[3rem] p-6 pb-12 shadow-2xl border-t ${theme.border}`}
          >
            <div className="w-12 h-1 bg-slate-700/30 rounded-full mx-auto mb-6" />

            {isScanning ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-black">Scanning Student ID...</h3>
                  <p className="text-xs text-slate-500">
                    Point camera at QR code
                  </p>
                </div>

                {/* Visual Camera Box (Transparent for Native Camera) */}
                <div className="relative aspect-square w-full max-w-70 mx-auto overflow-hidden rounded-4xl border-4 border-blue-600 bg-transparent flex items-center justify-center">
                  <Camera
                    size={48}
                    className="text-blue-600/20 animate-pulse"
                  />
                  <div
                    className="absolute inset-x-0 top-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                    style={{ animation: "scan 2s linear infinite" }}
                  />
                </div>

                <button
                  onClick={stopNativeScan}
                  className="w-full py-4 bg-slate-800 rounded-2xl font-black text-slate-300"
                >
                  Cancel Scan
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                      Handover Security
                    </p>
                    <h3 className="text-2xl font-black">
                      {selectedStudent?.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowVerifyModal(false);
                      startNativeScan();
                    }}
                    className="p-4 bg-blue-600/10 rounded-2xl text-blue-500"
                  >
                    <QrCode size={24} />
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6} // PIN length is now 6
                    value={pinInput}
                    onChange={(e) =>
                      setPinInput(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••••"
                    className="w-full text-center text-5xl tracking-[0.2em] font-black py-6 rounded-4xl bg-white/5 border-2 border-white/10 focus:border-blue-500 outline-none"
                  />
                  <p className="text-center text-[10px] text-slate-500 font-bold uppercase">
                    Enter 6-digit Security PIN
                  </p>
                </div>

                <button
                  onClick={submitVerification}
                  disabled={
                    (!scannedToken && pinInput.length < 6) || isVerifying
                  }
                  className={`w-full py-5 rounded-4xl font-black text-lg transition-all ${pinInput.length === 6 ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" : "bg-slate-800 text-slate-600"}`}
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />{" "}
                      Verifying...
                    </span>
                  ) : (
                    "Confirm Verification"
                  )}
                </button>

                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full text-slate-500 font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* SUCCESS ANIMATION OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center bg-emerald-500/90 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-4">
            <div className="bg-white rounded-full p-6 inline-block shadow-2xl animate-bounce">
              <CheckCircle2
                size={80}
                className="text-emerald-500"
                strokeWidth={3}
              />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              Verified
            </h2>
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm">
              Student Status Updated
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ... Sub-components (StudentItem, StatBlock) remain as you provided them
const StudentItem = ({
  name,
  phone,
  status,
  img,
  theme,
  color,
  isDone,
  onAction,
}: any) => (
  <div
    className={`${theme.card} p-4 rounded-3xl border ${theme.border} flex items-center justify-between shadow-sm`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-0.5 rounded-full border-2 ${color}`}>
        <img
          src={img}
          className="w-12 h-12 rounded-full object-cover"
          alt={name}
        />
      </div>
      <div>
        <h4 className="font-bold text-sm">{name}</h4>
        <p className={`text-[10px] font-bold ${theme.textSub} capitalize`}>
          {status}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <a
        href={`tel:${phone}`}
        className={`p-2 rounded-xl ${theme.bg} text-blue-500`}
      >
        <Phone size={18} />
      </a>
      <button
        onClick={onAction}
        className={`p-2 rounded-xl ${isDone ? "bg-emerald-500 text-white" : theme.bg + " " + theme.textSub}`}
      >
        {isDone ? <CheckCircle2 size={18} /> : <QrCode size={18} />}
      </button>
    </div>
  </div>
);

const StatBlock = ({ label, val, color, dark }: any) => (
  <div
    className={`${dark ? "bg-white/5" : "bg-slate-50"} p-3 rounded-2xl text-center border border-white/5`}
  >
    <p className={`text-[8px] font-black opacity-60 uppercase mb-1`}>{label}</p>
    <p className={`text-sm font-black ${color}`}>{val}</p>
  </div>
);

export default DriverDashboard;
