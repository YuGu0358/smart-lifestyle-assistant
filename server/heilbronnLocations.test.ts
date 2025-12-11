import { describe, expect, it } from "vitest";
import { getBuildingFromRoom, extractRoomFromLocation, getClassroomAddress } from "../shared/heilbronnLocations";

describe("Heilbronn Campus Address Mapping", () => {
  describe("getBuildingFromRoom", () => {
    it("should map rooms starting with digits to Etzelstraße", () => {
      const building = getBuildingFromRoom("1.234");
      expect(building).toBeTruthy();
      expect(building?.id).toBe("etzelstrasse");
      expect(building?.address).toBe("Etzelstraße 38");
    });

    it("should map rooms starting with 'D' to Bildungscampus", () => {
      const building = getBuildingFromRoom("D.2.01");
      expect(building).toBeTruthy();
      expect(building?.id).toBe("bildungscampus");
      expect(building?.address).toBe("Bildungscampus 2");
    });

    it("should map rooms starting with 'C' to Weipertstraße", () => {
      const building = getBuildingFromRoom("C.0.50");
      expect(building).toBeTruthy();
      expect(building?.id).toBe("weipertstrasse");
      expect(building?.address).toBe("Weipertstraße 8-10");
    });

    it("should handle lowercase input", () => {
      const building = getBuildingFromRoom("c.0.50");
      expect(building).toBeTruthy();
      expect(building?.id).toBe("weipertstrasse");
    });

    it("should return null for unrecognized format", () => {
      const building = getBuildingFromRoom("XYZ.123");
      expect(building).toBeNull();
    });
  });

  describe("extractRoomFromLocation", () => {
    it("should extract room from 'C.0.50, Hörsaal (1910.EG.050C)' format", () => {
      const room = extractRoomFromLocation("C.0.50, Hörsaal (1910.EG.050C)");
      expect(room).toBe("C.0.50");
    });

    it("should extract room from 'D.2.01, Seminarraum (1901.02.201)' format", () => {
      const room = extractRoomFromLocation("D.2.01, Seminarraum (1901.02.201)");
      expect(room).toBe("D.2.01");
    });

    it("should extract room from simple format '1.234'", () => {
      const room = extractRoomFromLocation("1.234");
      expect(room).toBe("1.234");
    });

    it("should return null for empty string", () => {
      const room = extractRoomFromLocation("");
      expect(room).toBeNull();
    });
  });

  describe("getClassroomAddress", () => {
    it("should return full address for Heilbronn classroom", () => {
      const address = getClassroomAddress("C.0.50, Hörsaal (1910.EG.050C)");
      expect(address).toBe("Weipertstraße 8-10, 74076 Heilbronn, Germany");
    });

    it("should return full address for Bildungscampus classroom", () => {
      const address = getClassroomAddress("D.2.01, Seminarraum (1901.02.201)");
      expect(address).toBe("Bildungscampus 2, 74076 Heilbronn, Germany");
    });

    it("should return full address for Etzelstraße classroom", () => {
      const address = getClassroomAddress("1.234");
      expect(address).toBe("Etzelstraße 38, 74076 Heilbronn, Germany");
    });

    it("should return null for invalid location", () => {
      const address = getClassroomAddress("Invalid Location");
      expect(address).toBeNull();
    });
  });

  describe("Real Heilbronn course schedule examples", () => {
    it("should correctly parse 'C.0.50, Hörsaal (1910.EG.050C)'", () => {
      const location = "C.0.50, Hörsaal (1910.EG.050C)";
      const room = extractRoomFromLocation(location);
      const building = getBuildingFromRoom(room!);
      const address = getClassroomAddress(location);

      console.log(`[Test] Location: ${location}`);
      console.log(`[Test] Extracted room: ${room}`);
      console.log(`[Test] Building: ${building?.name}`);
      console.log(`[Test] Full address: ${address}`);

      expect(room).toBe("C.0.50");
      expect(building?.name).toBe("Weipertstraße Campus");
      expect(address).toBe("Weipertstraße 8-10, 74076 Heilbronn, Germany");
    });

    it("should correctly parse 'D.2.01, Seminarraum (1901.02.201)'", () => {
      const location = "D.2.01, Seminarraum (1901.02.201)";
      const room = extractRoomFromLocation(location);
      const building = getBuildingFromRoom(room!);
      const address = getClassroomAddress(location);

      console.log(`[Test] Location: ${location}`);
      console.log(`[Test] Extracted room: ${room}`);
      console.log(`[Test] Building: ${building?.name}`);
      console.log(`[Test] Full address: ${address}`);

      expect(room).toBe("D.2.01");
      expect(building?.name).toBe("Bildungscampus");
      expect(address).toBe("Bildungscampus 2, 74076 Heilbronn, Germany");
    });
  });
});
