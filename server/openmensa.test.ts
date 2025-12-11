import { describe, expect, it } from "vitest";
import { getTodayMenu, getHeilbronnMenu } from "./openmensa";

describe("OpenMensa API Integration", () => {
  it("should fetch today's menu from Heilbronn Mensa", async () => {
    const meals = await getTodayMenu();
    
    console.log(`[Test] Found ${meals.length} meals for today`);
    
    // Menu might be empty if Mensa is closed
    expect(Array.isArray(meals)).toBe(true);
    
    if (meals.length > 0) {
      const firstMeal = meals[0];
      console.log(`[Test] First meal:`, firstMeal);
      
      // Check meal structure
      expect(firstMeal).toHaveProperty("id");
      expect(firstMeal).toHaveProperty("name");
      expect(firstMeal).toHaveProperty("category");
      expect(firstMeal).toHaveProperty("prices");
      expect(firstMeal).toHaveProperty("estimatedCalories");
      expect(firstMeal).toHaveProperty("estimatedProtein");
      expect(firstMeal).toHaveProperty("isVegetarian");
      expect(firstMeal).toHaveProperty("isVegan");
    }
  }, 15000);

  it("should fetch menu for a specific date", async () => {
    // Test with a recent date
    const testDate = "2024-11-26";
    const meals = await getHeilbronnMenu(testDate);
    
    console.log(`[Test] Found ${meals.length} meals for ${testDate}`);
    
    expect(Array.isArray(meals)).toBe(true);
  }, 15000);

  it("should handle closed days gracefully", async () => {
    // Test with a Sunday (Mensa is typically closed)
    const sunday = "2024-11-24"; // A Sunday
    const meals = await getHeilbronnMenu(sunday);
    
    console.log(`[Test] Sunday menu:`, meals);
    
    // Should return empty array for closed days
    expect(Array.isArray(meals)).toBe(true);
  }, 15000);
});
