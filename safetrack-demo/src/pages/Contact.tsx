import { useState } from "react";
import {  MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Contact = () => {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
        <Link
          to="/login"
          className="text-blue-600 font-bold text-sm mb-8 block"
        >
          ← Back to Login
        </Link>
        <h2 className="text-2xl font-black text-[#0f172a] mb-2">
          Get in Touch
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Having trouble? Our support team is here to help.
        </p>

        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="Your Name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              required
            />
            <textarea
              placeholder="How can we help?"
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              required
            />
            <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              Send Message
            </button>
          </form>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={24} />
            </div>
            <h3 className="font-bold text-[#0f172a]">Message Sent!</h3>
            <p className="text-gray-500 text-sm mt-1">
              We'll get back to you within 24 hours.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-blue-600 font-bold text-sm"
            >
              Send another message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
