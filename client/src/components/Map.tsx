/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - "map-attached" → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - "standalone" → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - "data-only" → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

// Use Google Maps API directly with the API key from environment variable
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function loadMapScript() {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      resolve(null);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(null));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(null);
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  showUserLocation?: boolean; // Enable real-time user location
  centerOnUserLocation?: boolean; // Auto-center map on user location
}

export function MapView({
  className,
  initialCenter = { lat: 48.1351, lng: 11.5820 }, // Munich center as default
  initialZoom = 12,
  onMapReady,
  showUserLocation = true,
  centerOnUserLocation = false,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const userLocationMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const watchId = useRef<number | null>(null);

  const init = usePersistFn(async () => {
    if (!API_KEY) {
      console.error("Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY environment variable.");
      return;
    }
    
    try {
      await loadMapScript();
      if (!mapContainer.current) {
        console.error("Map container not found");
        return;
      }
      if (!window.google || !window.google.maps) {
        console.error("Google Maps not loaded");
        return;
      }
      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });
      
      // Initialize user location tracking
      if (showUserLocation) {
        startLocationTracking();
      }
      
      if (onMapReady) {
        onMapReady(map.current);
      }
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  });

  const startLocationTracking = usePersistFn(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    // Request user location
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (!map.current || !window.google) return;

        // Create or update user location marker
        if (!userLocationMarker.current) {
          // Create custom marker element
          const markerElement = document.createElement('div');
          markerElement.style.width = '20px';
          markerElement.style.height = '20px';
          markerElement.style.borderRadius = '50%';
          markerElement.style.backgroundColor = '#4285F4';
          markerElement.style.border = '3px solid white';
          markerElement.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

          userLocationMarker.current = new window.google.maps.marker.AdvancedMarkerElement({
            map: map.current,
            position: userPos,
            content: markerElement,
            title: "Your Location",
          });

          // Center map on user location on first load
          if (centerOnUserLocation) {
            map.current.setCenter(userPos);
            map.current.setZoom(15);
          }
        } else {
          // Update marker position
          userLocationMarker.current.position = userPos;
        }
      },
      (error) => {
        console.error("Error getting user location:", error.message);
        // Handle different error cases
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.warn("User denied location permission");
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn("Location information unavailable");
            break;
          case error.TIMEOUT:
            console.warn("Location request timed out");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });

  useEffect(() => {
    init();
    
    // Cleanup: stop watching location when component unmounts
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [init]);

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)}>
      {!API_KEY && (
        <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
          <p>Map unavailable: API key not configured</p>
        </div>
      )}
    </div>
  );
}
