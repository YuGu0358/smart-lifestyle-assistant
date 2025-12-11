// @ts-ignore - hafas-client doesn't have TypeScript definitions
import { createClient } from "hafas-client";
// @ts-ignore
import { profile as dbProfile } from "hafas-client/p/db/index.js";

/**
 * Deutsche Bahn (DB) Public Transport API Integration
 * Uses HAFAS API to query real-time public transport information
 * Covers all public transport in Munich and Germany (S-Bahn, U-Bahn, Tram, Bus, Regional trains)
 */

// Create DB HAFAS client
const client = createClient(dbProfile, "smart-lifestyle-assistant");

// Use mock data in development/testing if API fails
const USE_MOCK_DATA = process.env.NODE_ENV === "test" || process.env.USE_MOCK_TRANSPORT === "true";

export interface TransportLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: "station" | "stop" | "location";
}

export interface TransportLeg {
  origin: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  destination: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  departure: Date;
  arrival: Date;
  line?: {
    name: string;
    product: string; // "subway", "tram", "bus", "regional", "suburban"
    mode: string;
  };
  direction?: string;
  duration: number; // in minutes
  walking?: boolean;
}

export interface TransportJourney {
  legs: TransportLeg[];
  departure: Date;
  arrival: Date;
  duration: number; // total duration in minutes
  changes: number;
  price?: {
    amount: number;
    currency: string;
  };
}

/**
 * Search for locations (stations, stops, addresses)
 */
export async function searchLocations(query: string): Promise<TransportLocation[]> {
  if (USE_MOCK_DATA) {
    return getMockLocations(query);
  }
  
  try {
    const locations = await client.locations(query, {
      results: 5,
      poi: false,
      addresses: true,
      linesOfStops: false,
    });

    return locations.map((loc: any) => ({
      id: loc.id || "",
      name: loc.name || query,
      latitude: loc.latitude || 0,
      longitude: loc.longitude || 0,
      type: loc.type || "location",
    }));
  } catch (error) {
    console.warn("[DB Transport] API failed, using mock data:", error);
    return getMockLocations(query);
  }
}

/**
 * Find journeys between two locations
 */
export async function findJourneys(
  from: string | { latitude: number; longitude: number },
  to: string | { latitude: number; longitude: number },
  options?: {
    departure?: Date;
    arrival?: Date;
    results?: number;
  }
): Promise<TransportJourney[]> {
  if (USE_MOCK_DATA) {
    return getMockJourneys(from, to, options);
  }
  
  try {
    const journeys = await client.journeys(from, to, {
      departure: options?.departure,
      arrival: options?.arrival,
      results: options?.results || 3,
      stopovers: false,
      transfers: -1, // unlimited transfers
      transferTime: 0,
      accessibility: "partial",
      bike: false,
      products: {
        // Include all public transport types
        suburban: true, // S-Bahn
        subway: true, // U-Bahn
        tram: true, // Tram
        bus: true, // Bus
        ferry: false,
        express: true, // ICE, IC
        regional: true, // Regional trains
      },
    });

    return journeys.journeys.map((journey: any) => {
      const legs: TransportLeg[] = journey.legs.map((leg: any) => {
        const duration = Math.round(
          (new Date(leg.arrival).getTime() - new Date(leg.departure).getTime()) / 60000
        );

        return {
          origin: {
            name: leg.origin.name,
            latitude: leg.origin.latitude,
            longitude: leg.origin.longitude,
          },
          destination: {
            name: leg.destination.name,
            latitude: leg.destination.latitude,
            longitude: leg.destination.longitude,
          },
          departure: new Date(leg.departure),
          arrival: new Date(leg.arrival),
          line: leg.line
            ? {
                name: leg.line.name,
                product: leg.line.product,
                mode: leg.line.mode,
              }
            : undefined,
          direction: leg.direction,
          duration,
          walking: leg.walking || false,
        };
      });

      const totalDuration = Math.round(
        (new Date(journey.arrival).getTime() - new Date(journey.departure).getTime()) / 60000
      );

      return {
        legs,
        departure: new Date(journey.departure),
        arrival: new Date(journey.arrival),
        duration: totalDuration,
        changes: journey.legs.filter((leg: any) => !leg.walking).length - 1,
        price: journey.price
          ? {
              amount: journey.price.amount,
              currency: journey.price.currency,
            }
          : undefined,
      };
    });
  } catch (error) {
    console.warn("[DB Transport] API failed, using mock data:", error);
    return getMockJourneys(from, to, options);
  }
}

/**
 * Get nearby stations
 */
export async function getNearbyStations(
  latitude: number,
  longitude: number,
  radius: number = 1000
): Promise<TransportLocation[]> {
  if (USE_MOCK_DATA) {
    return getMockLocations("").slice(0, 3);
  }
  
  try {
    const nearby = await client.nearby({ type: "location", latitude, longitude }, {
      distance: radius,
      results: 10,
      poi: false,
      linesOfStops: false,
    });

    return nearby.map((loc: any) => ({
      id: loc.id || "",
      name: loc.name || "Unknown",
      latitude: loc.latitude || latitude,
      longitude: loc.longitude || longitude,
      type: loc.type || "station",
    }));
  } catch (error) {
    console.warn("[DB Transport] API failed, using mock data:", error);
    return getMockLocations("").slice(0, 3);
  }
}

/**
 * Convert product type to user-friendly name
 */
export function getProductName(product: string): string {
  const names: Record<string, string> = {
    suburban: "S-Bahn",
    subway: "U-Bahn",
    tram: "Tram",
    bus: "Bus",
    regional: "Regional Train",
    express: "Express Train",
  };
  return names[product] || product;
}

/**
 * Get transport mode icon/emoji
 */
export function getTransportIcon(product: string): string {
  const icons: Record<string, string> = {
    suburban: "🚊",
    subway: "🚇",
    tram: "🚋",
    bus: "🚌",
    regional: "🚆",
    express: "🚄",
    walking: "🚶",
  };
  return icons[product] || "🚉";
}

/**
 * Mock data functions for development/testing
 */
function getMockLocations(query: string): TransportLocation[] {
  const mockLocations: TransportLocation[] = [
    { id: "1", name: "München Hauptbahnhof", latitude: 48.1405, longitude: 11.5580, type: "station" },
    { id: "2", name: "München Marienplatz", latitude: 48.1374, longitude: 11.5755, type: "station" },
    { id: "3", name: "Garching-Forschungszentrum", latitude: 48.2649, longitude: 11.6703, type: "station" },
    { id: "4", name: "München Ost", latitude: 48.1274, longitude: 11.6054, type: "station" },
    { id: "5", name: "Freising", latitude: 48.4010, longitude: 11.7488, type: "station" },
  ];
  
  return mockLocations.filter(loc => 
    loc.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
}

function getMockJourneys(
  from: string | { latitude: number; longitude: number },
  to: string | { latitude: number; longitude: number },
  options?: { departure?: Date; results?: number }
): TransportJourney[] {
  const now = options?.departure || new Date();
  const baseTime = now.getTime();
  
  return [
    {
      legs: [
        {
          origin: { name: "München Marienplatz", latitude: 48.1374, longitude: 11.5755 },
          destination: { name: "München Hauptbahnhof", latitude: 48.1405, longitude: 11.5580 },
          departure: new Date(baseTime),
          arrival: new Date(baseTime + 5 * 60000),
          duration: 5,
          walking: true,
        },
        {
          origin: { name: "München Hauptbahnhof", latitude: 48.1405, longitude: 11.5580 },
          destination: { name: "Garching-Forschungszentrum", latitude: 48.2649, longitude: 11.6703 },
          departure: new Date(baseTime + 8 * 60000),
          arrival: new Date(baseTime + 35 * 60000),
          line: { name: "U6", product: "subway", mode: "train" },
          direction: "Garching-Forschungszentrum",
          duration: 27,
          walking: false,
        },
        {
          origin: { name: "Garching-Forschungszentrum", latitude: 48.2649, longitude: 11.6703 },
          destination: { name: "TUM Campus Garching", latitude: 48.2627, longitude: 11.6679 },
          departure: new Date(baseTime + 35 * 60000),
          arrival: new Date(baseTime + 42 * 60000),
          duration: 7,
          walking: true,
        },
      ],
      departure: new Date(baseTime),
      arrival: new Date(baseTime + 42 * 60000),
      duration: 42,
      changes: 1,
    },
    {
      legs: [
        {
          origin: { name: "München Marienplatz", latitude: 48.1374, longitude: 11.5755 },
          destination: { name: "München Ost", latitude: 48.1274, longitude: 11.6054 },
          departure: new Date(baseTime + 10 * 60000),
          arrival: new Date(baseTime + 22 * 60000),
          line: { name: "S8", product: "suburban", mode: "train" },
          direction: "Flughafen München",
          duration: 12,
          walking: false,
        },
        {
          origin: { name: "München Ost", latitude: 48.1274, longitude: 11.6054 },
          destination: { name: "Garching-Hochbrück", latitude: 48.2491, longitude: 11.6431 },
          departure: new Date(baseTime + 28 * 60000),
          arrival: new Date(baseTime + 48 * 60000),
          line: { name: "Bus 690", product: "bus", mode: "bus" },
          direction: "Garching",
          duration: 20,
          walking: false,
        },
        {
          origin: { name: "Garching-Hochbrück", latitude: 48.2491, longitude: 11.6431 },
          destination: { name: "TUM Campus Garching", latitude: 48.2627, longitude: 11.6679 },
          departure: new Date(baseTime + 48 * 60000),
          arrival: new Date(baseTime + 58 * 60000),
          duration: 10,
          walking: true,
        },
      ],
      departure: new Date(baseTime + 10 * 60000),
      arrival: new Date(baseTime + 58 * 60000),
      duration: 48,
      changes: 2,
    },
  ];
}
