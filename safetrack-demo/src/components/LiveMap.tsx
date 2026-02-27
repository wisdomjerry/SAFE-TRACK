import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";

// Replace with your actual Mapbox public token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (typeof window !== "undefined") {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const LiveMap = ({
  lat,
  lng,
  isOnBus,
  heading,
  routePath,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // At the top of your component
  const nLat = useMemo(() => {
    const val = parseFloat(lat);
    return isFinite(val) ? val : 0.3476;
  }, [lat]);

  const nLng = useMemo(() => {
    const val = parseFloat(lng);
    return isFinite(val) ? val : 32.5825;
  }, [lng]);

  // Smoothly follow the driver whenever the coordinates change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      // Only fly if loaded!
      mapRef.current.flyTo({
        center: [nLng, nLat],
        duration: 2000,
        essential: true,
      });
    }
  }, [nLat, nLng, mapLoaded]);

  // Convert routePath for Mapbox GeoJSON (Mapbox uses [lng, lat])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeData: any = useMemo(
    () => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        coordinates: routePath?.map((p: any) => [p[1], p[0]]) || [],
      },
    }),
    [routePath],
  );

  return (
    <div className="h-full w-full relative z-0 overflow-hidden rounded-[2.5rem] shadow-inner">
      <Map
        ref={mapRef}
        onLoad={(e) => {
          const map = e.target;
          // Wait for style to fully finish
          map.once("style.load", () => {
            map.setLights([
              {
                id: "main-light",
                type: "flat",
                properties: {
                  color: "rgba(255, 255, 255, 0.4)",
                  intensity: 0.5,
                  position: [1.1, 90, 30],
                },
              },
            ]);
          });

          setMapLoaded(true);
        }}
        initialViewState={{
          longitude: nLng,
          latitude: nLat,
          zoom: 15,
          pitch: 45, // Gives that premium 3D look
        }}
        mapStyle="mapbox://styles/mapbox/standard"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        {/* 1. The Route Path (Tail) */}
        {routePath && routePath.length > 1 && (
          <Source id="routePath" type="geojson" data={routeData}>
            <Layer
              id="routeLine"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 4,
                "line-opacity": 0.4,
                "line-dasharray": [2, 1],
              }}
            />
          </Source>
        )}

        {/* 2. The Driver/Van Marker */}
        <Marker longitude={nLng} latitude={nLat} anchor="center">
          <div
            className="relative transition-transform duration-1000 ease-out"
            style={{ transform: `rotate(${heading || 0}deg)` }}
          >
            {/* Pulsing Blue Glow */}
            <div className="absolute inset-0 bg-blue-500 blur-md opacity-50 rounded-full animate-pulse scale-150" />

            {/* Van Icon */}
            <div className="bg-white p-1.5 rounded-full shadow-2xl border-2 border-blue-500 relative z-10">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
                alt="bus"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
        </Marker>

        {/* 3. Optional 3D Buildings */}
        {mapLoaded && (
          <Layer
            id="3d-buildings"
            source="composite"
            source-layer="building"
            filter={["==", "extrude", "true"]}
            type="fill-extrusion"
            minzoom={13}
            paint={{
              "fill-extrusion-color": "#2e394d",
              "fill-extrusion-height": ["coalesce", ["get", "height"], 15],
              "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
              "fill-extrusion-opacity": 0.8,
            }}
          />
        )}
      </Map>

      {/* 4. "Live" Status Badge */}
      {isOnBus && (
        <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-white uppercase tracking-tighter">
            Live Tracking
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
