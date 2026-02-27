import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef } from "react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const LiveMap = ({
  lat,
  lng,
  isOnBus,
  heading,
  routePath,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  const mapRef = useRef<MapRef>(null);

  // Safe numeric parsing
  const nLat = useMemo(() => {
    const val = parseFloat(lat);
    return isFinite(val) ? val : 0.3476;
  }, [lat]);

  const nLng = useMemo(() => {
    const val = parseFloat(lng);
    return isFinite(val) ? val : 32.5825;
  }, [lng]);

  // Smooth follow
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [nLng, nLat],
      duration: 1500,
      essential: true,
    });
  }, [nLat, nLng]);

  // GeoJSON route
  const routeData = useMemo(
    () => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          routePath?.map((p: any) => [p[1], p[0]]) || [],
      },
    }),
    [routePath]
  );

  return (
    <div className="h-full w-full relative overflow-hidden rounded-[2.5rem] shadow-inner">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: nLng,
          latitude: nLat,
          zoom: 16,
          pitch: 60,
        }}
        mapStyle="mapbox://styles/mapbox/navigation-day-v1"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Route */}
        {routePath?.length > 1 && (
          <Source id="route" type="geojson" data={routeData}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 4,
                "line-opacity": 0.5,
              }}
            />
          </Source>
        )}

        {/* 3D Buildings */}
        <Layer
          id="3d-buildings"
          source="composite"
          source-layer="building"
          filter={["==", ["get", "extrude"], "true"]}
          type="fill-extrusion"
          minzoom={14}
          paint={{
            "fill-extrusion-color": "#2e394d",
            "fill-extrusion-height": [
              "coalesce",
              ["get", "height"],
              15,
            ],
            "fill-extrusion-base": [
              "coalesce",
              ["get", "min_height"],
              0,
            ],
            "fill-extrusion-opacity": 0.8,
          }}
        />

        {/* Van Marker */}
        <Marker longitude={nLng} latitude={nLat} anchor="center">
          <div
            className="relative transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${heading || 0}deg)` }}
          >
            <div className="absolute inset-0 bg-blue-500 blur-md opacity-40 rounded-full animate-pulse scale-150" />

            <div className="relative bg-white p-1.5 rounded-full shadow-2xl border-2 border-blue-500">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
                alt="bus"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
        </Marker>
      </Map>

      {/* Live Badge */}
      {isOnBus && (
        <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-white uppercase">
            Live Tracking
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveMap;