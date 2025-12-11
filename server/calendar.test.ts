import { describe, expect, it } from "vitest";
import { parseICalendar } from "./calendar";
import { readFileSync } from "fs";
import { join } from "path";

describe("Calendar .ics Import", () => {
  it("should parse TUM course schedule from .ics file", async () => {
    const icsContent = readFileSync(join(__dirname, "../../test-tum-schedule.ics"), "utf-8");
    
    const courses = await parseICalendar(icsContent);
    
    expect(courses.length).toBeGreaterThan(0);
    expect(courses[0]).toHaveProperty("courseName");
    expect(courses[0]).toHaveProperty("startTime");
    expect(courses[0]).toHaveProperty("endTime");
    
    console.log(`\nParsed ${courses.length} courses:`);
    courses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.courseName}`);
      console.log(`   Location: ${course.location || "N/A"}`);
      console.log(`   Time: ${course.startTime.toLocaleString()} - ${course.endTime.toLocaleString()}`);
      console.log(`   Building: ${course.buildingName || "N/A"}`);
      console.log(`   Room: ${course.roomNumber || "N/A"}`);
    });
  });

  it("should extract course codes from summary", async () => {
    const icsContent = readFileSync(join(__dirname, "../../test-tum-schedule.ics"), "utf-8");
    
    const courses = await parseICalendar(icsContent);
    
    const dbCourse = courses.find(c => c.courseName.includes("IN2345"));
    expect(dbCourse).toBeDefined();
    expect(dbCourse?.courseCode).toBe("IN2345");
  });

  it("should parse building locations", async () => {
    const icsContent = readFileSync(join(__dirname, "../../test-tum-schedule.ics"), "utf-8");
    
    const courses = await parseICalendar(icsContent);
    
    const miCourse = courses.find(c => c.location?.includes("MI"));
    expect(miCourse).toBeDefined();
    expect(miCourse?.buildingName).toBe("Garching");
    if (miCourse?.roomNumber) {
      expect(miCourse.roomNumber).toContain("MI");
    }
  });
});
