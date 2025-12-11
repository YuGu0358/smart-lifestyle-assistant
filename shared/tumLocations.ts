/**
 * TUM Campus Buildings and Locations
 * Data for major TUM campuses and buildings in Munich
 */

export interface TUMLocation {
  id: string;
  name: string;
  campus: "Garching" | "Innenstadt" | "Weihenstephan" | "Other";
  address: string;
  lat: number;
  lng: number;
  description?: string;
}

export const TUM_CAMPUSES: TUMLocation[] = [
  // Garching Campus (Main Science & Engineering Campus)
  {
    id: "garching-main",
    name: "TUM Campus Garching",
    campus: "Garching",
    address: "Boltzmannstraße 3, 85748 Garching bei München",
    lat: 48.2627,
    lng: 11.6679,
    description: "Main campus for Computer Science, Physics, Mathematics, and Engineering",
  },
  {
    id: "garching-mi",
    name: "MI Building (Informatics)",
    campus: "Garching",
    address: "Boltzmannstraße 3, 85748 Garching",
    lat: 48.2625,
    lng: 11.6681,
    description: "Department of Informatics",
  },
  {
    id: "garching-mw",
    name: "MW Building (Mechanical Engineering)",
    campus: "Garching",
    address: "Boltzmannstraße 15, 85748 Garching",
    lat: 48.2650,
    lng: 11.6710,
    description: "Mechanical Engineering",
  },
  {
    id: "garching-physics",
    name: "Physics Department",
    campus: "Garching",
    address: "James-Franck-Straße 1, 85748 Garching",
    lat: 48.2638,
    lng: 11.6717,
    description: "Physics and related sciences",
  },

  // Innenstadt Campus (City Center)
  {
    id: "innenstadt-main",
    name: "TUM Main Building",
    campus: "Innenstadt",
    address: "Arcisstraße 21, 80333 München",
    lat: 48.1497,
    lng: 11.5679,
    description: "Historic main building, Architecture and Civil Engineering",
  },
  {
    id: "innenstadt-theresianum",
    name: "Theresianum",
    campus: "Innenstadt",
    address: "Theresienstraße 90, 80333 München",
    lat: 48.1520,
    lng: 11.5700,
    description: "Mathematics and related departments",
  },

  // Weihenstephan Campus (Life Sciences)
  {
    id: "weihenstephan-main",
    name: "TUM Campus Weihenstephan",
    campus: "Weihenstephan",
    address: "Alte Akademie 8, 85354 Freising",
    lat: 48.3975,
    lng: 11.7233,
    description: "Life Sciences, Biotechnology, and Brewing",
  },

  // Other Important Locations
  {
    id: "mensa-garching",
    name: "Mensa Garching",
    campus: "Garching",
    address: "Lichtenbergstraße 2, 85748 Garching",
    lat: 48.2655,
    lng: 11.6707,
    description: "Main cafeteria at Garching campus",
  },
  {
    id: "mensa-leopoldstrasse",
    name: "Mensa Leopoldstraße",
    campus: "Innenstadt",
    address: "Leopoldstraße 13a, 80802 München",
    lat: 48.1540,
    lng: 11.5810,
    description: "Cafeteria near city campus",
  },
];

/**
 * Get TUM location by building code or name
 */
export function getTUMLocation(query: string): TUMLocation | undefined {
  const normalized = query.toLowerCase();
  return TUM_CAMPUSES.find(
    (loc) =>
      loc.id.toLowerCase().includes(normalized) ||
      loc.name.toLowerCase().includes(normalized) ||
      loc.address.toLowerCase().includes(normalized)
  );
}

/**
 * Get all locations for a specific campus
 */
export function getLocationsByCampus(campus: TUMLocation["campus"]): TUMLocation[] {
  return TUM_CAMPUSES.filter((loc) => loc.campus === campus);
}
