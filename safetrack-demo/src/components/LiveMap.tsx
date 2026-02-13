import { MapContainer, TileLayer, Marker, useMap, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// 1. Custom Bus Icon
const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png", 
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: "bus-marker-icon", 
});

// 2. Component to handle auto-centering the map
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

// 3. LiveMap now accepts routePath for the polyline trail
const LiveMap = ({ lat, lng, isOnBus, heading, routePath }: any) => {
  const center: [number, number] = lat && lng ? [lat, lng] : [0.3476, 32.5825];

  // Rotate the icon using CSS transform when heading or position changes
  useEffect(() => {
    const iconElement = document.querySelector(".bus-marker-icon") as HTMLElement;
    if (iconElement && heading !== undefined) {
      iconElement.style.transform = `rotate(${heading}deg)`;
      iconElement.style.transition = "transform 0.5s ease-in-out"; 
    }
  }, [heading, lat, lng]); // Re-apply rotation whenever the bus moves or turns

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 4. The Polyline Trail (Drawn behind the bus) */}
        {routePath && routePath.length > 1 && (
          <Polyline 
            positions={routePath} 
            pathOptions={{ 
              color: '#3b82f6', // Bright blue trail
              weight: 5, 
              opacity: 0.6,
              lineJoin: 'round'
            }} 
          />
        )}
        
        {lat && lng && (
          <>
            <Marker position={[lat, lng]} icon={busIcon}>
              <Popup>
                <div className="font-bold">
                  {isOnBus ? "🚌 Bus is moving" : "🅿️ Bus is parked"}
                  {heading && (
                    <div className="text-[10px] text-gray-500">
                      Heading: {Math.round(heading)}°
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            <RecenterMap lat={lat} lng={lng} />
          </>
        )}
      </MapContainer>

      {isOnBus && (
        <div className="absolute top-4 right-4 z-1000 bg-white px-3 py-1.5 rounded-full shadow-lg border border-blue-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black text-gray-700 uppercase">Live GPS</span>
        </div>
      )}
    </div>
  );
};

export default LiveMap;