import { ShieldCheck, Lock, EyeOff, Server } from "lucide-react";
import { Link } from "react-router-dom";

const Security = () => {
  const features = [
    {
      icon: <Lock size={20} />,
      title: "Data Encryption",
      desc: "All student and school data is encrypted using industry-standard SSL/TLS.",
    },
    {
      icon: <EyeOff size={20} />,
      title: "Privacy First",
      desc: "PINs are hashed; even our system administrators cannot see your personal PIN.",
    },
    {
      icon: <Server size={20} />,
      title: "Secure Hosting",
      desc: "Our infrastructure is hosted on secure, compliant cloud servers with 99.9% uptime.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16 px-6 flex justify-center">
      <div className="max-w-2xl w-full">
        <Link
          to="/login"
          className="text-blue-600 font-bold text-sm mb-8 block"
        >
          ← Back to Login
        </Link>
        <header className="mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <ShieldCheck color="white" />
          </div>
          <h1 className="text-3xl font-black text-[#0f172a]">
            Security at Safe Track
          </h1>
          <p className="text-gray-500 mt-2">
            How we protect your institution and students.
          </p>
        </header>

        <div className="grid gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4"
            >
              <div className="text-blue-600">{f.icon}</div>
              <div>
                <h3 className="font-bold text-[#0f172a]">{f.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Security;
