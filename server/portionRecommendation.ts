/**
 * AI-Powered Portion Size Recommendation
 * Calculates optimal portion sizes based on user's fitness goals
 */

import { invokeLLM } from "./_core/llm";
import type { MealWithNutrition } from "./openmensa";

export interface UserFitnessGoals {
  dailyCalorieGoal?: number | null;
  proteinGoal?: number | null;
  budgetGoal?: number | null; // in cents
  dietaryRestrictions?: string | null;
  preferredCuisines?: string | null;
}

export interface MealHistory {
  caloriesConsumed: number;
  proteinConsumed: number;
  budgetSpent: number; // in cents
}

export interface PortionRecommendation {
  mealId: number;
  mealName: string;
  recommendedPortion: number; // multiplier (e.g., 1.0 = standard portion, 0.5 = half portion)
  portionInGrams?: number;
  reasoning: string;
  nutritionBreakdown: {
    calories: number;
    protein: number;
    price: number; // in cents
  };
}

export interface PortionRecommendationResponse {
  recommendations: PortionRecommendation[];
  aiSummary: string;
  dailyProgress: {
    caloriesRemaining: number;
    proteinRemaining: number;
    budgetRemaining: number;
  };
}

/**
 * Generate AI-powered portion recommendations for available meals
 */
export async function generatePortionRecommendations(
  userGoals: UserFitnessGoals,
  availableMeals: MealWithNutrition[],
  todayHistory?: MealHistory
): Promise<PortionRecommendationResponse> {
  // Calculate remaining daily allowances
  const caloriesRemaining = (userGoals.dailyCalorieGoal || 2000) - (todayHistory?.caloriesConsumed || 0);
  const proteinRemaining = (userGoals.proteinGoal || 80) - (todayHistory?.proteinConsumed || 0);
  const budgetRemaining = (userGoals.budgetGoal || 1000) - (todayHistory?.budgetSpent || 0);

  // Prepare meal data for AI
  const mealSummary = availableMeals.map(meal => ({
    id: meal.id,
    name: meal.name,
    category: meal.category,
    calories: meal.estimatedCalories,
    protein: meal.estimatedProtein,
    price: meal.prices.students || meal.prices.others || 0,
    isVegetarian: meal.isVegetarian,
    isVegan: meal.isVegan,
    notes: meal.notes,
  }));

  // Create prompt for Gemini
  const prompt = `You are a nutrition expert helping a student plan their meal at Heilbronn Mensa.

**User's Fitness Goals:**
- Daily Calorie Goal: ${userGoals.dailyCalorieGoal || 2000} kcal
- Daily Protein Goal: ${userGoals.proteinGoal || 80}g
- Daily Budget: €${((userGoals.budgetGoal || 1000) / 100).toFixed(2)}
${userGoals.dietaryRestrictions ? `- Dietary Restrictions: ${userGoals.dietaryRestrictions}` : ''}
${userGoals.preferredCuisines ? `- Preferred Cuisines: ${userGoals.preferredCuisines}` : ''}

**Today's Progress:**
- Calories Consumed: ${todayHistory?.caloriesConsumed || 0} kcal (Remaining: ${caloriesRemaining} kcal)
- Protein Consumed: ${todayHistory?.proteinConsumed || 0}g (Remaining: ${proteinRemaining}g)
- Budget Spent: €${((todayHistory?.budgetSpent || 0) / 100).toFixed(2)} (Remaining: €${(budgetRemaining / 100).toFixed(2)})

**Available Meals at Heilbronn Mensa Today:**
${JSON.stringify(mealSummary, null, 2)}

Please provide:
1. For each meal, recommend a portion size (as a multiplier: 1.0 = standard portion, 0.5 = half, 1.5 = 1.5x, etc.)
2. Explain WHY this portion size fits their goals
3. Calculate the nutrition breakdown for the recommended portion
4. Provide an overall summary with meal combination suggestions

Format your response as JSON:
{
  "recommendations": [
    {
      "mealId": number,
      "mealName": string,
      "recommendedPortion": number,
      "portionInGrams": number (estimate),
      "reasoning": string,
      "nutritionBreakdown": {
        "calories": number,
        "protein": number,
        "price": number (in cents)
      }
    }
  ],
  "aiSummary": "Overall meal planning advice and combination suggestions"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert. Always respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "portion_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    mealId: { type: "number" },
                    mealName: { type: "string" },
                    recommendedPortion: { type: "number" },
                    portionInGrams: { type: "number" },
                    reasoning: { type: "string" },
                    nutritionBreakdown: {
                      type: "object",
                      properties: {
                        calories: { type: "number" },
                        protein: { type: "number" },
                        price: { type: "number" },
                      },
                      required: ["calories", "protein", "price"],
                      additionalProperties: false,
                    },
                  },
                  required: ["mealId", "mealName", "recommendedPortion", "portionInGrams", "reasoning", "nutritionBreakdown"],
                  additionalProperties: false,
                },
              },
              aiSummary: { type: "string" },
            },
            required: ["recommendations", "aiSummary"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

    return {
      ...result,
      dailyProgress: {
        caloriesRemaining,
        proteinRemaining,
        budgetRemaining,
      },
    };
  } catch (error) {
    console.error("[PortionRecommendation] Error generating recommendations:", error);
    
    // Fallback: Simple rule-based recommendations
    const fallbackRecommendations: PortionRecommendation[] = availableMeals.map(meal => {
      const standardCalories = meal.estimatedCalories || 500;
      const portionMultiplier = Math.min(1.5, caloriesRemaining / standardCalories);
      
      return {
        mealId: meal.id,
        mealName: meal.name,
        recommendedPortion: Math.max(0.5, Math.min(1.5, portionMultiplier)),
        portionInGrams: Math.round((meal.estimatedCalories || 500) * 0.6), // Rough estimate
        reasoning: `Based on your remaining ${caloriesRemaining} kcal budget for today.`,
        nutritionBreakdown: {
          calories: Math.round(standardCalories * portionMultiplier),
          protein: Math.round((meal.estimatedProtein || 20) * portionMultiplier),
          price: Math.round((meal.prices.students || 500) * portionMultiplier),
        },
      };
    });

    return {
      recommendations: fallbackRecommendations,
      aiSummary: "Portion recommendations based on your remaining daily calorie budget.",
      dailyProgress: {
        caloriesRemaining,
        proteinRemaining,
        budgetRemaining,
      },
    };
  }
}
