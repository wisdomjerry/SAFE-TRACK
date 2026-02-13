import { useState } from "react";
import { Play, CheckCircle2, Phone, MapPin, Navigation } from "lucide-react";

const MyRoute = () => {
  const [students] = useState([]);
  const [isTripActive, setIsTripActive] = useState(false);
  const [completedStops, setCompletedStops] = useState<string[]>([]);

  // Toggle student boarding
  const toggleBoarding = (studentId: string) => {
    if (completedStops.includes(studentId)) {
      setCompletedStops(completedStops.filter(id => id !== studentId));
    } else {
      setCompletedStops([...completedStops, studentId]);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Trip Header */}
      <div className="bg-white p-6 sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-[#1d1c1d]">Morning Route</h2>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
            {students.length} Students
          </span>
        </div>
        
        {!isTripActive ? (
          <button 
            onClick={() => setIsTripActive(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-100 transition-all active:scale-95"
          >
            <Play fill="currentColor" size={20} /> START TRIP
          </button>
        ) : (
          <button 
            onClick={() => setIsTripActive(false)}
            className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 border-2 border-red-100"
          >
            END TRIP
          </button>
        )}
      </div>

      {/* Route List */}
      <div className="p-4 space-y-4">
        {/* Example Student Stop */}
        {[1, 2, 3].map((_, i) => (
          <div 
            key={i} 
            className={`p-4 rounded-3xl border-2 transition-all ${
              completedStops.includes(i.toString()) 
              ? 'bg-gray-50 border-transparent opacity-60' 
              : 'bg-white border-gray-100 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Student Name {i + 1}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                    <MapPin size={12} />
                    <span>Block A, Sector 4</span>
                  </div>
                </div>
              </div>
              <a href="tel:123" className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Phone size={20} />
              </a>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <Navigation size={16} /> Navigate
              </button>
              <button 
                onClick={() => toggleBoarding(i.toString())}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  completedStops.includes(i.toString())
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-50 text-blue-600'
                }`}
              >
                <CheckCircle2 size={16} /> {completedStops.includes(i.toString()) ? 'Boarded' : 'Check-in'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRoute;