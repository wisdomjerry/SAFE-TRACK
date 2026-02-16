/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, MapPin, Bell, ArrowRight, Lock, CheckCircle2, Globe, Users } from "lucide-react";

/* ----------------------------------
   Feature Card (Enhanced)
----------------------------------- */
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc }) => (
  <div className="group p-6 md:p-8 bg-white rounded-4xl md:rounded-4xl border border-slate-100 hover:border-blue-200 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-2">
    <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 md:mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-inner">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
    </div>
    <h3 className="text-xl font-black mb-4 text-slate-900 tracking-tight">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">{desc}</p>
  </div>
);

/* ----------------------------------
   Landing Page
----------------------------------- */
const LandingPage: React.FC = () => {
  return (
    // Removed overflow-hidden from here to allow natural scrolling
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100">
      
      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors">
              <ShieldCheck className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900">
              SafeTrack
            </span>
          </div>

          <div className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#security" className="hover:text-blue-600 transition">Security</a>
            <Link to="/contact" className="hover:text-blue-600 transition">Support</Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/login" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition">
              Sign In
            </Link>
            <Link
              to="/register-school"
              className="px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95 text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      {/* Changed pt-44 to pt-32 on mobile and removed fixed height constraints */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-24 left-[10%] w-72 h-72 bg-blue-100 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-10 right-[5%] w-96 h-96 bg-indigo-100 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 md:mb-8">
              <CheckCircle2 size={14} strokeWidth={3} /> Trusted by 50+ Institutions
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] md:leading-[0.95] mb-6 md:mb-8 tracking-tighter text-slate-900">
              Reliable <br className="hidden md:block" />
              <span className="text-blue-600">Transit</span> for <br className="hidden md:block" />
              Modern Schools.
            </h1>

            <p className="text-base md:text-lg text-slate-500 font-medium mb-8 md:mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              The only all-in-one platform providing real-time fleet intelligence, encrypted parent handovers, and total route visibility.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link
                to="/register-school"
                className="group flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-blue-600 text-white font-black text-xs md:text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95"
              >
                Launch Your Fleet <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="px-8 md:px-10 py-4 md:py-5 rounded-2xl border-2 border-slate-100 text-slate-900 font-black text-xs md:text-sm uppercase tracking-widest hover:bg-slate-50 transition-all text-center"
              >
                Live Demo
              </Link>
            </div>
            
            <div className="mt-10 md:mt-12 flex items-center justify-center lg:justify-start gap-6 md:gap-8 grayscale opacity-40">
                <div className="flex items-center gap-2 font-black text-[9px] md:text-xs uppercase tracking-tighter"><Globe size={16}/> Global Standards</div>
                <div className="flex items-center gap-2 font-black text-[9px] md:text-xs uppercase tracking-tighter"><Users size={16}/> 10k+ Students</div>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="absolute -inset-4 bg-linear-to-tr from-blue-100 to-indigo-100 blur-3xl rounded-4xl md:rounded-[3rem] opacity-50" />
            <div className="relative rounded-4xl md:rounded-[3rem] overflow-hidden border-4 md:border-12 border-white shadow-2xl shadow-slate-200 transition-transform duration-700 hover:rotate-1">
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"
                alt="Dashboard Preview"
                className="w-full h-auto object-cover aspect-video lg:aspect-4/3"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="py-20 md:py-32 bg-slate-50/50 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4 md:mb-6 leading-tight">
                Engineered for <br className="hidden md:block" />Absolute Safety.
              </h2>
              <p className="text-slate-500 font-medium text-sm md:text-base">We've digitized every step of the school commute to eliminate human error and ensure every child arrives safely.</p>
            </div>
            <Link to="/features" className="text-blue-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all w-fit">
                Explore All Capabilities <ArrowRight size={16}/>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
            <FeatureCard
              icon={<MapPin />}
              title="Live Fleet Tracking"
              desc="Pinpoint accuracy for every shuttle. Reduce parent anxiety with real-time GPS coordinates and traffic alerts."
            />
            <FeatureCard
              icon={<Lock />}
              title="Secure PIN Handover"
              desc="The gold standard in security. Drivers verify pickups using parent-generated encrypted 6-digit tokens."
            />
            <FeatureCard
              icon={<Bell />}
              title="Predictive Notifications"
              desc="Automated geofencing alerts parents exactly 2 minutes before the shuttle arrives at their stop."
            />
          </div>
        </div>
      </section>

      {/* ================= SECURITY BANNER ================= */}
      <section id="security" className="py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-4xl md:rounded-[3rem] p-10 md:p-12 lg:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full" />
          <ShieldCheck size={60} className="mx-auto text-blue-400 mb-6 md:mb-8 opacity-50" strokeWidth={1} />
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-black mb-6 md:mb-8 tracking-tighter">
            Bank-Grade <span className="text-blue-400">Security</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-8 md:mb-12 font-medium leading-relaxed">
            Protecting student data is our highest priority. Every transaction is guarded by AES-256 encryption and Supabase Row Level Security.
          </p>

          <div className="flex flex-wrap justify-center gap-4 md:gap-10 grayscale opacity-40">
            {["AES-256", "SSL SECURE", "GDPR READY", "2FA ENABLED"].map(text => (
                <span key={text} className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] border border-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg">{text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-slate-100 pt-16 md:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-16 md:mb-24">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="text-white" size={18} />
                </div>
                <span className="text-xl font-black tracking-tighter">SafeTrack</span>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xs">
                Setting the global standard for secure educational logistics and student safety during transit.
            </p>
          </div>
          
          {[
            { title: "Product", links: ["Features", "Security", "Live Demo"] },
            { title: "Support", links: ["Contact Sales", "Help Center", "Privacy"] },
            { title: "Legal", links: ["Terms", "Cookie Policy", "Compliance"] }
          ].map((col) => (
            <div key={col.title}>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 md:mb-8">{col.title}</h4>
                <ul className="space-y-3 md:space-y-4">
                    {col.links.map(link => (
                        <li key={link}>
                            <a href="#" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">{link}</a>
                        </li>
                    ))}
                </ul>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 border-t border-slate-50 text-center">
          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.5em]">
            &copy; {new Date().getFullYear()} SAFETRACK ENGINEERING. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;