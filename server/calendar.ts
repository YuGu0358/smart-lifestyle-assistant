import * as ical from "node-ical";
import { getClassroomAddress, getBuildingFromRoom, extractRoomFromLocation } from "../shared/heilbronnLocations";

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
    const parsedData = await ical.async.parseICS(icsContent);

    for (const key in parsedData) {
      const event = parsedData[key];

      // Only process VEVENT entries (actual calendar events)
      if (event.type === "VEVENT" && event.start && event.end) {
        const courseName = event.summary || "Untitled Course";
        const location = event.location || "";

        // Extract course code (e.g., "IN2345 - Database Systems")
        const codeMatch = courseName.match(/^([A-Z]{2}\d{4})/);
        const courseCode = codeMatch ? codeMatch[1] : undefined;

        // Parse building and room
        // First try Heilbronn format (C.0.50, D.2.01, 1.234)
        const roomNumber = extractRoomFromLocation(location) || undefined;
        const heilbronnBuilding = roomNumber ? getBuildingFromRoom(roomNumber) : null;
        
        let buildingName = heilbronnBuilding?.name;
        
        // Fallback to TUM format if not Heilbronn
        if (!buildingName) {
          const tumRoomMatch = location.match(/(?:MI|MW|CH|PH)\s*(?:HS\s*)?\d+/i);
          const tumBuildingMatch = location.match(/(Garching|Innenstadt|Weihenstephan|Klinikum)/i);
          buildingName = tumBuildingMatch ? tumBuildingMatch[1] : undefined;
        }

        courses.push({
          courseName,
          courseCode,
          location: location || undefined,
          buildingName,
          roomNumber,
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
};

/**
 * Get building location from course location string
 */
export function getBuildingLocation(
  location: string
): { lat: number; lng: number; name: string } | null {
  for (const [code, building] of Object.entries(TUM_BUILDINGS)) {
    if (location.includes(code)) {
      return {
        lat: building.lat,
        lng: building.lng,
        name: building.name,
      };
    }
  }

  // Default to Garching campus if no match
  if (location.toLowerCase().includes("garching")) {
    return {
      lat: 48.2649,
      lng: 11.6703,
      name: "TUM Garching Campus",
    };
  }

  return null;
}
