import { describe, expect, it } from "vitest";
import { generateMealRecommendations } from "./gemini";

describe("AI Course Schedule Integration", () => {
  it("should generate meal recommendations with course context", async () => {
    const userProfile = {
      calorieGoal: 2000,
      proteinGoal: 80,
      budgetGoal: 1000, // €10
      dietaryRestrictions: ["vegetarian"],
      preferredCuisines: ["Mediterranean", "Asian"],
    };

    const availableDishes = [
      {
        dishName: "Pasta Primavera",
        mensaName: "Mensa Garching",
        calories: 550,
        protein: 18,
        price: 450,
        labels: ["vegetarian"],
      },
      {
        dishName: "Tofu Stir-Fry",
        mensaName: "Mensa Leopoldstraße",
        calories: 480,
        protein: 22,
        price: 520,
        labels: ["vegan", "asian"],
      },
    ];

    const todaysCourses = [
      {
        courseName: "Grundlagen: Datenbanken",
        startTime: new Date("2025-11-24T13:15:00"),
        endTime: new Date("2025-11-24T15:00:00"),
        location: "Campus Heilbronn VO, Standardgruppe",
      },
      {
        courseName: "Informationstheorie und theoretische Informatik",
        startTime: new Date("2025-11-24T09:15:00"),
        endTime: new Date("2025-11-24T10:45:00"),
        location: "Campus Heilbronn VO, Standardgruppe",
      },
    ];

    const recommendation = await generateMealRecommendations(
      userProfile,
      availableDishes,
      undefined,
      todaysCourses
    );

    expect(recommendation).toBeTruthy();
    expect(typeof recommendation).toBe("string");
    expect(recommendation.length).toBeGreaterThan(50);
    
    console.log("\n=== AI Meal Recommendation with Course Context ===");
    console.log(recommendation);
  }, 30000);

  it("should work without course data", async () => {
    const userProfile = {
      calorieGoal: 2000,
      proteinGoal: 80,
    };

    const availableDishes = [
      {
        dishName: "Chicken Salad",
        mensaName: "Mensa Garching",
        calories: 400,
        protein: 30,
        price: 550,
      },
    ];

    const recommendation = await generateMealRecommendations(
      userProfile,
      availableDishes
    );

    expect(recommendation).toBeTruthy();
    expect(typeof recommendation).toBe("string");
  }, 30000);
});
