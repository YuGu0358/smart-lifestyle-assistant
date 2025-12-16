/**
 * Heilbronn Campus Building Address Mapping
 * Maps classroom prefixes to their physical addresses
 */

export interface HeilbronnBuilding {
  id: string;
  name: string;
  address: string;
  fullAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const HEILBRONN_BUILDINGS: Record<string, HeilbronnBuilding> = {
  etzelstrasse: {
    id: "etzelstrasse",
    name: "Etzelstraße Campus",
    address: "Etzelstraße 38",
    fullAddress: "Etzelstraße 38, 74076 Heilbronn, Germany",
    coordinates: {
      lat: 49.1427,
      lng: 9.2181,
    },
  },
  bildungscampus: {
    id: "bildungscampus",
    name: "Bildungscampus",
    address: "Bildungscampus 2",
    fullAddress: "Bildungscampus 2, 74076 Heilbronn, Germany",
    coordinates: {
      lat: 49.1419,
      lng: 9.2144,
    },
  },
  weipertstrasse: {
    id: "weipertstrasse",
    name: "Weipertstraße Campus",
    address: "Weipertstraße 8-10",
    fullAddress: "Weipertstraße 8-10, 74076 Heilbronn, Germany",
    coordinates: {
      lat: 49.1398,
      lng: 9.2203,
    },
  },
};

/**
 * Determine building from classroom/room identifier
 * @param room Room identifier (e.g., "1.234", "D.2.01", "C.0.50")
 * @returns Building information or null if not recognized
 */
export function getBuildingFromRoom(room: string): HeilbronnBuilding | null {
  if (!room) return null;

  const trimmedRoom = room.trim().toUpperCase();

  // Rooms starting with digits → Etzelstraße
  if (/^\d/.test(trimmedRoom)) {
    return HEILBRONN_BUILDINGS.etzelstrasse;
  }

  // Rooms starting with 'D' → Bildungscampus
  if (trimmedRoom.startsWith("D")) {
    return HEILBRONN_BUILDINGS.bildungscampus;
  }

  // Rooms starting with 'C' → Weipertstraße
  if (trimmedRoom.startsWith("C")) {
    return HEILBRONN_BUILDINGS.weipertstrasse;
  }

  // Rooms starting with 'L' → Etzelstraße (same building)
  if (trimmedRoom.startsWith("L")) {
    return HEILBRONN_BUILDINGS.etzelstrasse;
  }

  return null;
}

/**
 * Extract room identifier from location string
 * Handles formats like:
 * - "C.0.50, Hörsaal (1910.EG.050C)"
 * - "D.2.01, Seminarraum (1901.02.201)"
 * - "1.234"
 */
export function extractRoomFromLocation(location: string): string | null {
  if (!location) return null;

  // Try to extract room code before comma
  // Matches: "C.0.50", "D.2.01", "1.234", etc.
  const match = location.match(/^([A-Z]\.[\d.]+|\d+(?:\.\d+)*)/i);
  if (match) {
    return match[1];
  }

  return null;
}

/**
 * Get full address for a classroom location
 */
export function getClassroomAddress(location: string): string | null {
  const room = extractRoomFromLocation(location);
  if (!room) return null;

  const building = getBuildingFromRoom(room);
  return building?.fullAddress || null;
}
