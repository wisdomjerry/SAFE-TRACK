/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { supabase } from "../config/supabaseClient";

export const useGpsBroadcaster = (vanId: string, isActive: boolean) => {
  // Use Refs to persist coordinates across the session without triggering re-renders
  const lastCoords = useRef({ lat: 0, lng: 0 });
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !vanId) return;

    const getAddress = async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        );
        if (!res.ok) return null;
        const data = await res.json();
        // Returns "Street Name, Area"
        return data.display_name.split(",").slice(0, 2).join(",");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        return null;
      }
    };

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude, speed, heading } = position.coords;

      // 1. Prepare base data
      const updateData: any = {
        current_lat: latitude,
        current_lng: longitude,
        heading: heading || 0,
        current_speed: Math.round((speed || 0) * 3.6),
        last_updated: new Date().toISOString(),
      };

      const isFirstRun = lastCoords.current.lat === 0;
      const hasMovedSignificant =
        Math.abs(latitude - lastCoords.current.lat) > 0.0005 ||
        Math.abs(longitude - lastCoords.current.lng) > 0.0005;

      // 2. Handle Address Update (Don't 'await' it here to keep the map fast)
      if (isFirstRun || hasMovedSignificant) {
        lastCoords.current = { lat: latitude, lng: longitude };

        getAddress(latitude, longitude).then((currentAddress) => {
          if (currentAddress) {
            // Update ONLY the address column once we have it
            supabase
              .from("vans")
              .update({ current_location_name: currentAddress })
              .eq("id", vanId);
          }
        });
      }

      // 3. Sync Position to Supabase IMMEDIATELY
      await supabase.from("vans").update(updateData).eq("id", vanId);

      // 4. Breadcrumbs (History)
      if (isFirstRun || hasMovedSignificant) {
        await supabase
          .from("van_location_history")
          .insert([{ van_id: vanId, lat: latitude, lng: longitude }]);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        console.error("📍 GPS Watch Error:", error.message);

        // If it's a timeout (code 3), it means the device is struggling with GPS signal
        if (error.code === 3) {
          console.warn("🔄 GPS Timeout. Retrying with longer window...");
        }
      },
      {
        enableHighAccuracy: true, // Keep this for precise tracking
        maximumAge: 5000, // Don't use a location older than 5 seconds
        timeout: 15000, // 🟢 CHANGE: Give it 15 seconds to find a lock
      },
    );
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [vanId, isActive]);
};
