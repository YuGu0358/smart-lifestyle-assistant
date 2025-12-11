import { describe, expect, it } from "vitest";
import { findJourneys, searchLocations, getNearbyStations } from "./db-transport";

describe("DB Transport API", () => {
  it("should search for locations in Munich", async () => {
    const locations = await searchLocations("München Hauptbahnhof");
    
    expect(locations.length).toBeGreaterThan(0);
    expect(locations[0]).toHaveProperty("name");
    expect(locations[0]).toHaveProperty("latitude");
    expect(locations[0]).toHaveProperty("longitude");
    
    console.log("\nFound locations:");
    locations.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc.name} (${loc.type})`);
      console.log(`   Coordinates: ${loc.latitude}, ${loc.longitude}`);
    });
  }, 30000);

  it("should find journeys from Munich center to TUM Garching", async () => {
    // Munich Marienplatz to TUM Garching Campus
    const journeys = await findJourneys(
      { latitude: 48.1374, longitude: 11.5755 }, // Marienplatz
      { latitude: 48.2627, longitude: 11.6679 }, // TUM Garching
      {
        departure: new Date(Date.now() + 3600000), // 1 hour from now
        results: 2,
      }
    );
    
    expect(journeys.length).toBeGreaterThan(0);
    expect(journeys[0]).toHaveProperty("legs");
    expect(journeys[0]).toHaveProperty("duration");
    expect(journeys[0]).toHaveProperty("changes");
    
    console.log(`\nFound ${journeys.length} journeys from Munich to TUM Garching:`);
    journeys.forEach((journey, index) => {
      console.log(`\n--- Journey ${index + 1} ---`);
      console.log(`Duration: ${journey.duration} minutes`);
      console.log(`Changes: ${journey.changes}`);
      console.log(`Departure: ${journey.departure.toLocaleTimeString()}`);
      console.log(`Arrival: ${journey.arrival.toLocaleTimeString()}`);
      
      console.log("\nLegs:");
      journey.legs.forEach((leg, legIndex) => {
        if (leg.walking) {
          console.log(`  ${legIndex + 1}. 🚶 Walk (${leg.duration} min)`);
        } else if (leg.line) {
          console.log(`  ${legIndex + 1}. ${leg.line.name} (${leg.line.product})`);
          console.log(`     ${leg.origin.name} → ${leg.destination.name}`);
          console.log(`     ${leg.duration} minutes`);
        }
      });
    });
  }, 30000);

  it("should find nearby stations", async () => {
    // TUM Main Building coordinates
    const stations = await getNearbyStations(48.1497, 11.5679, 500);
    
    expect(stations.length).toBeGreaterThan(0);
    
    console.log("\nNearby stations to TUM Main Building:");
    stations.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name} (${station.type})`);
    });
  }, 30000);
});
