/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { supabase } from "../config/supabaseClient";

export const useGpsBroadcaster = (vanId: string, isActive: boolean) => {
  // Use Refs to persist coordinates across the session without triggering re-renders
  const lastCoords = useRef({ lat: 0, lng: 0 });

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

      const isFirstRun = lastCoords.current.lat === 0;

      // Logic: Only save history if moved ~10-15m (approx 0.0001 degrees)
      // This prevents database bloat
      const hasMovedEnoughForHistory =
        Math.abs(latitude - lastCoords.current.lat) > 0.0001 ||
        Math.abs(longitude - lastCoords.current.lng) > 0.0001;

      const hasMovedSignificant =
        Math.abs(latitude - lastCoords.current.lat) > 0.0005 ||
        Math.abs(longitude - lastCoords.current.lng) > 0.0005;

      const updateData: any = {
        current_lat: latitude,
        current_lng: longitude,
        heading: heading || 0,
        current_speed: Math.round((speed || 0) * 3.6),
        last_updated: new Date().toISOString(),
      };

      if (isFirstRun || hasMovedSignificant) {
        const currentAddress = await getAddress(latitude, longitude);
        if (currentAddress) {
          updateData.current_location_name = currentAddress;
        }
        lastCoords.current = { lat: latitude, lng: longitude };
      }

      // A. Sync current state to 'vans' table
      const { error: vanError } = await supabase
        .from("vans")
        .update(updateData)
        .eq("id", vanId);

      if (vanError) console.error("Vans Sync Error:", vanError.message);

      // B. NEW: Insert breadcrumb into history table
      if (isFirstRun || hasMovedEnoughForHistory) {
        const { error: histError } = await supabase
          .from("van_location_history")
          .insert([
            {
              van_id: vanId,
              lat: latitude,
              lng: longitude,
            },
          ]);

        if (histError) console.error("History Sync Error:", histError.message);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => console.error("GPS Watch Error:", error),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [vanId, isActive]);
};
