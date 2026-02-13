import { Link } from "react-router-dom";

const Privacy = () => (
  <div className="min-h-screen bg-white py-16 px-6 flex justify-center font-sans">
    <article className="max-w-2xl w-full prose prose-blue">
      <h1 className="text-3xl font-black text-[#0f172a] mb-6">Privacy Policy</h1>
      <p className="text-gray-600 mb-4">Last Updated: February 2026</p>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-[#0f172a] mb-3">1. Information We Collect</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Safe Track collects phone numbers for authentication, student names for transportation tracking, and school identification to ensure secure access. Location data is only used for real-time bus tracking.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-[#0f172a] mb-3">2. How We Use Data</h2>
        <ul className="list-disc pl-5 text-gray-600 text-sm space-y-2">
          <li>To facilitate communication between parents and drivers.</li>
          <li>To provide real-time tracking of school shuttles.</li>
          <li>To prevent unauthorized access to school information.</li>
        </ul>
      </section>

      <Link to="/login" className="inline-block mt-8 px-6 py-3 bg-[#0f172a] text-white font-bold rounded-xl text-sm">Accept & Go Back</Link>
    </article>
  </div>
);

export default Privacy;