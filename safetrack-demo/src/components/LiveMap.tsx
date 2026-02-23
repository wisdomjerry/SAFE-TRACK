import { MapContainer, TileLayer, Marker, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";

// 1. Better Icon Handling (prevents multiple icon class issues)
const createBusIcon = (heading: number) => new L.DivIcon({
  html: `<div style="transform: rotate(${heading || 0}deg); transition: all 0.5s ease-in-out;">
           <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" style="width:40px; height:40px;" />
         </div>`,
  className: "custom-bus-container",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      // .flyTo makes the movement smooth and professional
      map.flyTo([lat, lng], map.getZoom(), {
        animate: true,
        duration: 1.5
      });
    }
  }, [lat, lng, map]);
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LiveMap = ({ lat, lng, isOnBus, heading, routePath }: any) => {
  // Memoize icon to prevent flickering during rapid GPS updates
  const dynamicIcon = useMemo(() => createBusIcon(heading), [heading]);

  // Handle case where coords might be strings from database
  const nLat = parseFloat(lat);
  const nLng = parseFloat(lng);
  const center: [number, number] = nLat && nLng ? [nLat, nLng] : [0.3476, 32.5825];

  return (
    <div className="h-full w-full relative z-0 overflow-hidden rounded-4xl">
      <MapContainer
        center={center}
        zoom={16}
        zoomControl={false} // Cleaner UI for mobile
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OSM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routePath && routePath.length > 1 && (
          <Polyline 
            positions={routePath} 
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.5, lineCap: 'round' }} 
          />
        )}
        
        {nLat && nLng && (
          <>
            <Marker position={[nLat, nLng]} icon={dynamicIcon} />
            <RecenterMap lat={nLat} lng={nLng} />
          </>
        )}
      </MapContainer>

      {/* Modern Badge UI */}
      {isOnBus && (
        <div className="absolute top-4 right-4 z-1000 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Live</span>
        </div>
      )}
    </div>
  );
};

export default LiveMap;