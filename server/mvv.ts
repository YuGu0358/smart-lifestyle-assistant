/**
 * MVV (Munich Public Transport) API Integration
 * Uses the public MVV API for real-time transit data
 */

export interface MVVLocation {
  name: string;
  lat: number;
  lng: number;
  type?: string;
}

export interface MVVRoute {
  from: MVVLocation;
  to: MVVLocation;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // in minutes
  transfers: number;
  legs: MVVLeg[];
}

export interface MVVLeg {
  mode: string; // "U-Bahn", "S-Bahn", "Bus", "Tram", "Walking"
  line?: string;
  direction?: string;
  from: MVVLocation;
  to: MVVLocation;
  departureTime: Date;
  arrivalTime: Date;
  duration: number;
}

/**
 * Get route suggestions from MVV API
 * Using the public transport API for Munich
 */
export async function getMVVRoutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  departureTime?: Date
): Promise<MVVRoute[]> {
  // MVV uses the EFA (Elektronische Fahrplanauskunft) API
  // We'll use the public endpoint for route planning
  const baseUrl = "https://www.mvv-muenchen.de/api/fib/v2/";

  try {
    // For a real implementation, we would call the actual MVV API
    // For now, we'll return mock data based on realistic MVV patterns
    return generateMockMVVRoutes(from, to, departureTime);
  } catch (error) {
    console.error("MVV API error:", error);
    throw new Error("Failed to fetch MVV routes");
  }
}

/**
 * Generate realistic mock MVV routes
 * This simulates the actual MVV network in Munich
 */
function generateMockMVVRoutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  departureTime?: Date
): MVVRoute[] {
  const now = departureTime || new Date();
  const routes: MVVRoute[] = [];

  // Calculate approximate distance (simplified)
  const distance = Math.sqrt(
    Math.pow((to.lat - from.lat) * 111, 2) + Math.pow((to.lng - from.lng) * 85, 2)
  );

  // Route 1: U-Bahn + Walking (fastest)
  const route1Duration = Math.max(15, Math.floor(distance * 2.5));
  const route1Arrival = new Date(now.getTime() + route1Duration * 60000);

  routes.push({
    from: { name: "Start", lat: from.lat, lng: from.lng },
    to: { name: "Destination", lat: to.lat, lng: to.lng },
    departureTime: now,
    arrivalTime: route1Arrival,
    duration: route1Duration,
    transfers: 1,
    legs: [
      {
        mode: "Walking",
        from: { name: "Start", lat: from.lat, lng: from.lng },
        to: { name: "U-Bahn Station", lat: from.lat + 0.002, lng: from.lng + 0.001 },
        departureTime: now,
        arrivalTime: new Date(now.getTime() + 5 * 60000),
        duration: 5,
      },
      {
        mode: "U-Bahn",
        line: "U6",
        direction: "Garching-Forschungszentrum",
        from: { name: "U-Bahn Station", lat: from.lat + 0.002, lng: from.lng + 0.001 },
        to: { name: "Destination Station", lat: to.lat - 0.002, lng: to.lng - 0.001 },
        departureTime: new Date(now.getTime() + 5 * 60000),
        arrivalTime: new Date(now.getTime() + (route1Duration - 3) * 60000),
        duration: route1Duration - 8,
      },
      {
        mode: "Walking",
        from: { name: "Destination Station", lat: to.lat - 0.002, lng: to.lng - 0.001 },
        to: { name: "Destination", lat: to.lat, lng: to.lng },
        departureTime: new Date(now.getTime() + (route1Duration - 3) * 60000),
        arrivalTime: route1Arrival,
        duration: 3,
      },
    ],
  });

  // Route 2: Bus (fewer transfers)
  const route2Duration = route1Duration + 8;
  const route2Departure = new Date(now.getTime() + 7 * 60000); // Bus in 7 minutes
  const route2Arrival = new Date(route2Departure.getTime() + route2Duration * 60000);

  routes.push({
    from: { name: "Start", lat: from.lat, lng: from.lng },
    to: { name: "Destination", lat: to.lat, lng: to.lng },
    departureTime: route2Departure,
    arrivalTime: route2Arrival,
    duration: route2Duration,
    transfers: 0,
    legs: [
      {
        mode: "Walking",
        from: { name: "Start", lat: from.lat, lng: from.lng },
        to: { name: "Bus Stop", lat: from.lat + 0.001, lng: from.lng },
        departureTime: route2Departure,
        arrivalTime: new Date(route2Departure.getTime() + 3 * 60000),
        duration: 3,
      },
      {
        mode: "Bus",
        line: "269",
        direction: "Garching Forschungszentrum",
        from: { name: "Bus Stop", lat: from.lat + 0.001, lng: from.lng },
        to: { name: "Destination Stop", lat: to.lat - 0.001, lng: to.lng },
        departureTime: new Date(route2Departure.getTime() + 3 * 60000),
        arrivalTime: new Date(route2Arrival.getTime() - 2 * 60000),
        duration: route2Duration - 5,
      },
      {
        mode: "Walking",
        from: { name: "Destination Stop", lat: to.lat - 0.001, lng: to.lng },
        to: { name: "Destination", lat: to.lat, lng: to.lng },
        departureTime: new Date(route2Arrival.getTime() - 2 * 60000),
        arrivalTime: route2Arrival,
        duration: 2,
      },
    ],
  });

  // Route 3: S-Bahn + U-Bahn (alternative)
  const route3Duration = route1Duration + 5;
  const route3Departure = new Date(now.getTime() + 3 * 60000);
  const route3Arrival = new Date(route3Departure.getTime() + route3Duration * 60000);

  routes.push({
    from: { name: "Start", lat: from.lat, lng: from.lng },
    to: { name: "Destination", lat: to.lat, lng: to.lng },
    departureTime: route3Departure,
    arrivalTime: route3Arrival,
    duration: route3Duration,
    transfers: 2,
    legs: [
      {
        mode: "Walking",
        from: { name: "Start", lat: from.lat, lng: from.lng },
        to: { name: "S-Bahn Station", lat: from.lat + 0.003, lng: from.lng },
        departureTime: route3Departure,
        arrivalTime: new Date(route3Departure.getTime() + 4 * 60000),
        duration: 4,
      },
      {
        mode: "S-Bahn",
        line: "S1",
        direction: "Freising",
        from: { name: "S-Bahn Station", lat: from.lat + 0.003, lng: from.lng },
        to: { name: "Transfer Station", lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 },
        departureTime: new Date(route3Departure.getTime() + 4 * 60000),
        arrivalTime: new Date(route3Departure.getTime() + (route3Duration / 2) * 60000),
        duration: Math.floor(route3Duration / 2) - 4,
      },
      {
        mode: "U-Bahn",
        line: "U3",
        direction: "Moosach",
        from: { name: "Transfer Station", lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 },
        to: { name: "Destination Station", lat: to.lat - 0.002, lng: to.lng },
        departureTime: new Date(route3Departure.getTime() + (route3Duration / 2 + 2) * 60000),
        arrivalTime: new Date(route3Arrival.getTime() - 3 * 60000),
        duration: Math.floor(route3Duration / 2) - 2,
      },
      {
        mode: "Walking",
        from: { name: "Destination Station", lat: to.lat - 0.002, lng: to.lng },
        to: { name: "Destination", lat: to.lat, lng: to.lng },
        departureTime: new Date(route3Arrival.getTime() - 3 * 60000),
        arrivalTime: route3Arrival,
        duration: 3,
      },
    ],
  });

  return routes;
}

/**
 * Get real-time departure information for a station
 */
export async function getMVVDepartures(stationName: string): Promise<any[]> {
  // Mock departure data
  return [
    {
      line: "U6",
      direction: "Garching-Forschungszentrum",
      departureTime: new Date(Date.now() + 3 * 60000),
      delay: 0,
    },
    {
      line: "U6",
      direction: "Klinikum Großhadern",
      departureTime: new Date(Date.now() + 5 * 60000),
      delay: 2,
    },
    {
      line: "Bus 269",
      direction: "Garching Forschungszentrum",
      departureTime: new Date(Date.now() + 7 * 60000),
      delay: 0,
    },
  ];
}

/**
 * Calculate optimal departure time based on user's pace
 */
export function calculateDepartureTime(
  arrivalTime: Date,
  routeDuration: number,
  userPace: "slow" | "average" | "fast" = "average",
  bufferMinutes: number = 5
): Date {
  const paceMultipliers = {
    slow: 1.2,
    average: 1.0,
    fast: 0.9,
  };

  const adjustedDuration = routeDuration * paceMultipliers[userPace] + bufferMinutes;
  return new Date(arrivalTime.getTime() - adjustedDuration * 60000);
}
