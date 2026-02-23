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

      // IMPORTANT: We update the 'vans' table EVERY time the phone moves,
      // even by 1 meter. This ensures the "Live" map is always perfect.
      const updateData: any = {
        current_lat: latitude,
        current_lng: longitude,
        heading: heading || 0,
        current_speed: Math.round((speed || 0) * 3.6),
        last_updated: new Date().toISOString(),
      };

      // We only do the expensive Address lookup (Reverse Geocoding)
      // if they have moved significantly (approx 50m)
      const isFirstRun = lastCoords.current.lat === 0;
      const hasMovedSignificant =
        Math.abs(latitude - lastCoords.current.lat) > 0.0005 ||
        Math.abs(longitude - lastCoords.current.lng) > 0.0005;

      if (isFirstRun || hasMovedSignificant) {
        const currentAddress = await getAddress(latitude, longitude);
        if (currentAddress) {
          updateData.current_location_name = currentAddress;
        }
        lastCoords.current = { lat: latitude, lng: longitude };
      }

      // Sync to Supabase - This is what moves the marker on the map
      await supabase.from("vans").update(updateData).eq("id", vanId);

      // History inserts (breadcrumbs) should still stay strict to save DB space
      if (isFirstRun || Math.abs(latitude - lastCoords.current.lat) > 0.0001) {
        await supabase.from("van_location_history").insert([
          {
            van_id: vanId,
            lat: latitude,
            lng: longitude,
          },
        ]);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => console.error("GPS Watch Error:", error),
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 10000,
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
