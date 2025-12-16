import ical from "node-ical";
import { getClassroomAddress, getBuildingFromRoom, extractRoomFromLocation, HEILBRONN_BUILDINGS } from "../shared/heilbronnLocations";

/**
 * iCalendar (.ics) Parser for TUM Course Schedules
 * Uses node-ical library for robust parsing
 */

export interface ParsedCourse {
  courseName: string;
  courseCode?: string;
  location?: string;
  buildingName?: string;
  roomNumber?: string;
  fullAddress?: string;
  startTime: Date;
  endTime: Date;
  recurrenceRule?: string;
  description?: string;
  uid?: string;
}

/**
 * Parse iCalendar (.ics) file content using node-ical
 */
export async function parseICalendar(icsContent: string): Promise<ParsedCourse[]> {
  const courses: ParsedCourse[] = [];

  try {
    // Use sync parsing which is more reliable in ESM context
    const parsedData = ical.sync.parseICS(icsContent);

    for (const key in parsedData) {
      const event = parsedData[key];

      // Only process VEVENT entries (actual calendar events)
      if (event.type === "VEVENT" && event.start && event.end) {
        const courseName = event.summary || "Untitled Course";
        const location = event.location || "";

        // Extract course code (e.g., "IN2345 - Database Systems" or "INHN0001")
        const codeMatch = courseName.match(/\(([A-Z]{2,}[A-Z0-9]+)\)/) || courseName.match(/^([A-Z]{2}\d{4})/);
        const courseCode = codeMatch ? codeMatch[1] : undefined;

        // Parse building and room
        // First try Heilbronn format (C.0.50, D.2.01, 1.234, L.1.11)
        const roomNumber = extractRoomFromLocation(location) || undefined;
        const heilbronnBuilding = roomNumber ? getBuildingFromRoom(roomNumber) : null;
        
        let buildingName = heilbronnBuilding?.name;
        let fullAddress = heilbronnBuilding?.fullAddress;
        
        // Also check for L prefix (maps to Etzelstraße)
        if (!buildingName && roomNumber?.toUpperCase().startsWith('L')) {
          buildingName = HEILBRONN_BUILDINGS.etzelstrasse.name;
          fullAddress = HEILBRONN_BUILDINGS.etzelstrasse.fullAddress;
        }
        
        // Fallback to TUM format if not Heilbronn
        if (!buildingName) {
          const tumRoomMatch = location.match(/(?:MI|MW|CH|PH)\s*(?:HS\s*)?\d+/i);
          const tumBuildingMatch = location.match(/(Garching|Innenstadt|Weihenstephan|Klinikum)/i);
          
          if (tumBuildingMatch) {
            buildingName = tumBuildingMatch[1];
            const tumBuilding = TUM_BUILDINGS[buildingName] || Object.values(TUM_BUILDINGS).find(b => b.name.includes(buildingName!));
            fullAddress = tumBuilding?.address;
          }
          
          // Check for Heilbronn campus indicators from TUM room codes
          if (!buildingName) {
            // Room codes like (1910.EG.050C) indicate Heilbronn
            const heilbronnCodeMatch = location.match(/\(19(?:01|02|10|15)\./);
            if (heilbronnCodeMatch) {
              const code = heilbronnCodeMatch[0];
              if (code.includes('1901') || code.includes('1902')) {
                // D building - Bildungscampus
                buildingName = HEILBRONN_BUILDINGS.bildungscampus.name;
                fullAddress = HEILBRONN_BUILDINGS.bildungscampus.fullAddress;
              } else if (code.includes('1910') || code.includes('1915')) {
                // C building - Weipertstraße
                buildingName = HEILBRONN_BUILDINGS.weipertstrasse.name;
                fullAddress = HEILBRONN_BUILDINGS.weipertstrasse.fullAddress;
              }
            }
          }
        }

        courses.push({
          courseName,
          courseCode,
          location: location || undefined,
          buildingName,
          roomNumber,
          fullAddress,
          startTime: new Date(event.start),
          endTime: new Date(event.end),
          recurrenceRule: event.rrule?.toString(),
          description: event.description || undefined,
          uid: event.uid || undefined,
        });
      }
    }

    console.log(`[Calendar] Parsed ${courses.length} courses from iCalendar file`);
    return courses;
  } catch (error) {
    console.error("[Calendar] Failed to parse iCalendar file:", error);
    throw new Error("Invalid iCalendar file format");
  }
}

/**
 * TUM Campus building locations (approximate)
 */
export const TUM_BUILDINGS: Record<
  string,
  { name: string; lat: number; lng: number; address: string }
> = {
  // Garching Campus
  MI: {
    name: "Mathematik/Informatik Gebäude",
    lat: 48.2627,
    lng: 11.6679,
    address: "Boltzmannstraße 3, 85748 Garching",
  },
  MW: {
    name: "Maschinenwesen",
    lat: 48.2651,
    lng: 11.6708,
    address: "Boltzmannstraße 15, 85748 Garching",
  },
  CH: {
    name: "Chemie",
    lat: 48.2638,
    lng: 11.6694,
    address: "Lichtenbergstraße 4, 85748 Garching",
  },
  PH: {
    name: "Physik",
    lat: 48.2625,
    lng: 11.6685,
    address: "James-Franck-Straße 1, 85748 Garching",
  },

  // Innenstadt Campus
  Arcisstraße: {
    name: "Hauptgebäude Arcisstraße",
    lat: 48.1497,
    lng: 11.5679,
    address: "Arcisstraße 21, 80333 München",
  },
  Theresienstraße: {
    name: "Theresienstraße",
    lat: 48.1515,
    lng: 11.5693,
    address: "Theresienstraße 90, 80333 München",
  },
  
  // Heilbronn Campus
  Etzelstraße: {
    name: "Etzelstraße Campus",
    lat: 49.1427,
    lng: 9.2181,
    address: "Etzelstraße 38, 74076 Heilbronn",
  },
  Bildungscampus: {
    name: "Bildungscampus",
    lat: 49.1419,
    lng: 9.2144,
    address: "Bildungscampus 2, 74076 Heilbronn",
  },
  Weipertstraße: {
    name: "Weipertstraße Campus",
    lat: 49.1398,
    lng: 9.2203,
    address: "Weipertstraße 8-10, 74076 Heilbronn",
  },
};

/**
 * Get building location from course location string
 */
export function getBuildingLocation(
  location: string
): { lat: number; lng: number; name: string; address: string } | null {
  // First check Heilbronn buildings
  const roomNumber = extractRoomFromLocation(location);
  if (roomNumber) {
    const heilbronnBuilding = getBuildingFromRoom(roomNumber);
    if (heilbronnBuilding?.coordinates) {
      return {
        lat: heilbronnBuilding.coordinates.lat,
        lng: heilbronnBuilding.coordinates.lng,
        name: heilbronnBuilding.name,
        address: heilbronnBuilding.fullAddress,
      };
    }
    
    // Check L prefix (Etzelstraße)
    if (roomNumber.toUpperCase().startsWith('L')) {
      return {
        lat: HEILBRONN_BUILDINGS.etzelstrasse.coordinates!.lat,
        lng: HEILBRONN_BUILDINGS.etzelstrasse.coordinates!.lng,
        name: HEILBRONN_BUILDINGS.etzelstrasse.name,
        address: HEILBRONN_BUILDINGS.etzelstrasse.fullAddress,
      };
    }
  }
  
  // Check for Heilbronn room codes in parentheses
  const heilbronnCodeMatch = location.match(/\(19(?:01|02|10|15)\./);
  if (heilbronnCodeMatch) {
    const code = heilbronnCodeMatch[0];
    if (code.includes('1901') || code.includes('1902')) {
      return {
        lat: HEILBRONN_BUILDINGS.bildungscampus.coordinates!.lat,
        lng: HEILBRONN_BUILDINGS.bildungscampus.coordinates!.lng,
        name: HEILBRONN_BUILDINGS.bildungscampus.name,
        address: HEILBRONN_BUILDINGS.bildungscampus.fullAddress,
      };
    } else if (code.includes('1910') || code.includes('1915')) {
      return {
        lat: HEILBRONN_BUILDINGS.weipertstrasse.coordinates!.lat,
        lng: HEILBRONN_BUILDINGS.weipertstrasse.coordinates!.lng,
        name: HEILBRONN_BUILDINGS.weipertstrasse.name,
        address: HEILBRONN_BUILDINGS.weipertstrasse.fullAddress,
      };
    }
  }

  // Check TUM buildings
  for (const [code, building] of Object.entries(TUM_BUILDINGS)) {
    if (location.includes(code)) {
      return {
        lat: building.lat,
        lng: building.lng,
        name: building.name,
        address: building.address,
      };
    }
  }

  // Default to Garching campus if no match
  if (location.toLowerCase().includes("garching")) {
    return {
      lat: 48.2649,
      lng: 11.6703,
      name: "TUM Garching Campus",
      address: "Boltzmannstraße, 85748 Garching",
    };
  }

  return null;
}
