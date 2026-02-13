import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  BarChart3,
  Check,
  ArrowRight,
} from "lucide-react";

/* -----------------------------
    REUSABLE FEATURE DETAIL
-------------------------------- */

interface FeatureDetailProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  imageSide: "left" | "right";
  imgSrc: string;
  points: string[];
}

const FeatureDetail: React.FC<FeatureDetailProps> = ({
  icon,
  title,
  description,
  imageSide,
  imgSrc,
  points,
}) => {
  const isImageLeft = imageSide === "left";

  return (
    <div className="relative py-20 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* TEXT CONTENT */}
          <div className={`${isImageLeft ? "lg:order-2" : "lg:order-1"} z-10`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-6">
              <span className="p-1.5 rounded-md bg-blue-600 text-white shadow-sm">
                {React.isValidElement(icon)
                  ? React.cloneElement(icon as React.ReactElement<any>, {
                      size: 14,
                    })
                  : icon}
              </span>
              Enterprise Ready
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-6">
              {title}
            </h2>

            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8">
              {description}
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {points.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-slate-700 font-bold text-sm"
                >
                  <div className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check size={12} strokeWidth={4} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* VISUAL CONTENT */}
          <div
            className={`${isImageLeft ? "lg:order-1" : "lg:order-2"} relative group`}
          >
            {/* Soft Glow Background */}
            <div
              className={`absolute -inset-10 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:opacity-40 ${isImageLeft ? "bg-blue-400" : "bg-indigo-400"}`}
            />

            <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
              <img
                src={imgSrc}
                alt={title}
                className="w-full h-75 lg:h-112.5 object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -----------------------------
    MAIN FEATURES PAGE
-------------------------------- */

const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[30%] h-[30%] rounded-full bg-indigo-50 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center px-6">
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em]">
            SafeTrack v4.0
          </span>

          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-none">
            Total Visibility.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
              Zero Compromise.
            </span>
          </h1>

          <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            The world's first transport management system designed specifically
            for the unique security needs of private and public schools.
          </p>
        </div>
      </section>

      {/* CORE FEATURES LIST */}
      <section className="pb-20">
        <FeatureDetail
          imageSide="right"
          icon={<MapPin />}
          title="Fleet Visibility in Real-Time"
          description="Never wonder where a shuttle is again. Our sub-meter GPS accuracy provides updates every 3 seconds to drivers, admins, and parents."
          points={[
            "Live Traffic Overlays",
            "Historical Playbacks",
            "ETA Predictive AI",
          ]}
          imgSrc="https://images.unsplash.com/photo-1527030280862-64139fba04ca?auto=format&fit=crop&w=800&q=80"
        />

        <FeatureDetail
          imageSide="left"
          icon={<ShieldCheck />}
          title="Secure Verification Protocol"
          description="Manual check-ins are prone to error. Our 2FA handover requires parents to provide a rotating PIN or QR scan before a student is marked as 'Dropped Off'."
          points={[
            "Rotational 6-digit PIN",
            "QR Code Handover",
            "Photo Verification",
          ]}
          imgSrc="https://images.unsplash.com/photo-1585829319232-0640aef94660?auto=format&fit=crop&w=800&q=80"
        />

        <FeatureDetail
          imageSide="right"
          icon={<BarChart3 />}
          title="Smart Compliance Engine"
          description="Audit-ready logs generated instantly. Track fuel efficiency, driver performance, and student attendance patterns through one central console."
          points={[
            "One-click PDF Audits",
            "Driver Scorecards",
            "Attendance Trends",
          ]}
          imgSrc="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
        />
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />

          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-8 tracking-tight">
              Ready to upgrade your
              <br />
              school's logistics?
            </h2>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register-school"
                className="group bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                Launch Platform{" "}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>

              <Link
                to="/contact"
                className="bg-white/10 text-white border border-white/20 backdrop-blur-md px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SIMPLE FOOTER */}
      <footer className="py-12 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
          SafeTrack Engineering © 2026
        </p>
      </footer>
    </div>
  );
};

export default FeaturesPage;
