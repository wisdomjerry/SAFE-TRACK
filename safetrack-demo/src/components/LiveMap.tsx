import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef } from "react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Added activeChild to the props so the badge has data to display
const LiveMap = ({
  lat,
  lng,
  isOnBus,
  heading,
  routePath,
  activeChild, // NEW: Pass the student data here
}: any) => {
  const mapRef = useRef<MapRef>(null);

  const nLat = useMemo(() => {
    const val = parseFloat(lat);
    return isFinite(val) ? val : 0.3476;
  }, [lat]);

  const nLng = useMemo(() => {
    const val = parseFloat(lng);
    return isFinite(val) ? val : 32.5825;
  }, [lng]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [nLng, nLat],
      bearing: heading || 0,
      pitch: 60,
      duration: 1500,
      essential: true,
    });
  }, [nLat, nLng, heading]);

  const routeData = useMemo(
    () => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routePath?.map((p: any) => [p[1], p[0]]) || [],
      },
    }),
    [routePath],
  );

  return (
    <div className="h-full w-full relative overflow-hidden rounded-[2.5rem] shadow-inner border-4 border-white/10">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: nLng,
          latitude: nLat,
          zoom: 16,
          pitch: 60,
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        {/* 3D Buildings - Modern Slate Look */}
        <Layer
          id="3d-buildings"
          source="composite"
          source-layer="building"
          type="fill-extrusion"
          minzoom={14}
          paint={{
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["get", "height"],
              0, "#d1d5db",
              50, "#9ca3af",
              200, "#6b7280",
            ],
            "fill-extrusion-height": ["coalesce", ["get", "height"], 15],
            "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
            "fill-extrusion-opacity": 0.9,
          }}
        />

        {routePath?.length > 1 && (
          <Source id="route" type="geojson" data={routeData}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 4,
                "line-opacity": 0.4,
              }}
            />
          </Source>
        )}

        {/* Combined Van + Student Marker */}
        <Marker longitude={nLng} latitude={nLat} anchor="center">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Blue Ground Shadow */}
            <div className="absolute w-16 h-16 bg-blue-500 rounded-full opacity-20 blur-xl animate-pulse" />

            {/* Van Body */}
            <div
              className="relative transition-transform duration-500 ease-out z-10"
              style={{ transform: `rotate(${heading || 0}deg)` }}
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-full shadow-2xl border-2 border-white">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
                  alt="bus"
                  className="w-7 h-7 object-contain brightness-0 invert"
                />
              </div>
            </div>

            {/* THE STUDENT AVATAR - Now correctly positioned INSIDE the marker */}
            {activeChild?.status === "picked_up" && (
              <div className="absolute -top-6 -right-6 z-20">
                <div className="relative group">
                   {/* Green Status Ping */}
                  <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-30" />
                  
                  <div className="relative h-10 w-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-slate-200">
                    <img
                      src={activeChild.image || "https://ui-avatars.com/api/?name=" + activeChild.name}
                      className="w-full h-full object-cover"
                      alt="on board"
                    />
                  </div>
                  
                  {/* Small check icon */}
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-white">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Marker>
      </Map>

      {/* Live Badge */}
      {isOnBus && (
        <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-3">
          <div className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
            En Route
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveMap;