/**
 * TUM Mensa (Canteen) Data Integration
 * Fetches daily menus from TUM canteens
 */

export interface MensaDish {
  mensaId: string;
  mensaName: string;
  dishName: string;
  category: string;
  price: number; // in cents
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergens: string[];
  labels: string[]; // vegetarian, vegan, bio, etc.
  availableDate: Date;
}

/**
 * TUM Mensa locations
 */
export const TUM_MENSAS = [
  {
    id: "mensa-garching",
    name: "Mensa Garching",
    location: { lat: 48.2649, lng: 11.6703 },
    address: "Boltzmannstraße 19, 85748 Garching",
  },
  {
    id: "mensa-leopoldstrasse",
    name: "Mensa Leopoldstraße",
    location: { lat: 48.1547, lng: 11.5809 },
    address: "Leopoldstraße 13a, 80802 München",
  },
  {
    id: "mensa-arcisstrasse",
    name: "Mensa Arcisstraße",
    location: { lat: 48.1497, lng: 11.5679 },
    address: "Arcisstraße 17, 80333 München",
  },
  {
    id: "stubistro-arcisstrasse",
    name: "StuBistro Arcisstraße",
    location: { lat: 48.1497, lng: 11.5679 },
    address: "Arcisstraße 17, 80333 München",
  },
];

/**
 * Fetch today's menu from TUM Mensa API
 * Note: TUM uses the OpenMensa API standard
 */
export async function fetchTUMMensaMenu(
  mensaId: string,
  date: Date = new Date()
): Promise<MensaDish[]> {
  try {
    // For a real implementation, we would call the actual OpenMensa API
    // Example: https://openmensa.org/api/v2/canteens/{id}/days/{date}/meals
    // For now, we'll return realistic mock data
    return generateMockMensaMenu(mensaId, date);
  } catch (error) {
    console.error(`Failed to fetch menu for ${mensaId}:`, error);
    return [];
  }
}

/**
 * Generate realistic mock menu data for TUM Mensas
 */
function generateMockMensaMenu(mensaId: string, date: Date): MensaDish[] {
  const mensa = TUM_MENSAS.find((m) => m.id === mensaId);
  if (!mensa) return [];

  const dishes: MensaDish[] = [
    // Main dishes
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Hähnchenbrust mit Reis und Gemüse",
      category: "Hauptgericht",
      price: 395, // €3.95
      calories: 520,
      protein: 42,
      carbs: 58,
      fat: 12,
      allergens: ["Gluten"],
      labels: [],
      availableDate: date,
    },
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Vegetarische Lasagne",
      category: "Hauptgericht",
      price: 350,
      calories: 480,
      protein: 18,
      carbs: 52,
      fat: 22,
      allergens: ["Gluten", "Milch", "Ei"],
      labels: ["Vegetarisch"],
      availableDate: date,
    },
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Vegane Buddha Bowl mit Quinoa",
      category: "Hauptgericht",
      price: 420,
      calories: 450,
      protein: 15,
      carbs: 65,
      fat: 14,
      allergens: ["Sesam"],
      labels: ["Vegan", "Bio"],
      availableDate: date,
    },
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Schweinebraten mit Kartoffeln und Soße",
      category: "Hauptgericht",
      price: 410,
      calories: 680,
      protein: 38,
      carbs: 48,
      fat: 35,
      allergens: ["Gluten"],
      labels: [],
      availableDate: date,
    },
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Pasta Arrabiata",
      category: "Hauptgericht",
      price: 290,
      calories: 420,
      protein: 12,
      carbs: 72,
      fat: 8,
      allergens: ["Gluten"],
      labels: ["Vegan"],
      availableDate: date,
    },
    // Soups
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Tomatensuppe",
      category: "Suppe",
      price: 150,
      calories: 120,
      protein: 3,
      carbs: 18,
      fat: 4,
      allergens: [],
      labels: ["Vegan"],
      availableDate: date,
    },
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Kürbissuppe",
      category: "Suppe",
      price: 150,
      calories: 140,
      protein: 4,
      carbs: 22,
      fat: 5,
      allergens: ["Milch"],
      labels: ["Vegetarisch"],
      availableDate: date,
    },
    // Salads
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Großer gemischter Salat",
      category: "Salat",
      price: 320,
      calories: 180,
      protein: 8,
      carbs: 15,
      fat: 10,
      allergens: [],
      labels: ["Vegan", "Bio"],
      availableDate: date,
    },
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Caesar Salad",
      category: "Salat",
      price: 380,
      calories: 320,
      protein: 22,
      carbs: 18,
      fat: 18,
      allergens: ["Gluten", "Milch", "Ei", "Fisch"],
      labels: [],
      availableDate: date,
    },
    // Desserts
    {
      mensaId: mensa.id,
      mensaName: mensa.name,
      dishName: "Apfelstrudel",
      category: "Dessert",
      price: 180,
      calories: 280,
      protein: 4,
      carbs: 42,
      fat: 12,
      allergens: ["Gluten", "Milch", "Ei"],
      labels: ["Vegetarisch"],
      availableDate: date,
    },
  ];

  return dishes;
}

/**
 * Fetch menus from all TUM Mensas for a given date
 */
export async function fetchAllMensaMenus(date: Date = new Date()): Promise<MensaDish[]> {
  const allMenus: MensaDish[] = [];

  for (const mensa of TUM_MENSAS) {
    const menu = await fetchTUMMensaMenu(mensa.id, date);
    allMenus.push(...menu);
  }

  return allMenus;
}

/**
 * Filter dishes based on dietary restrictions and preferences
 */
export function filterDishes(
  dishes: MensaDish[],
  filters: {
    maxPrice?: number; // in cents
    maxCalories?: number;
    minProtein?: number;
    dietaryRestrictions?: string[]; // allergens to avoid
    requiredLabels?: string[]; // e.g., "Vegan", "Vegetarisch"
    preferredMensas?: string[];
  }
): MensaDish[] {
  return dishes.filter((dish) => {
    // Price filter
    if (filters.maxPrice && dish.price > filters.maxPrice) return false;

    // Calorie filter
    if (filters.maxCalories && dish.calories && dish.calories > filters.maxCalories) return false;

    // Protein filter
    if (filters.minProtein && dish.protein && dish.protein < filters.minProtein) return false;

    // Allergen filter
    if (filters.dietaryRestrictions) {
      const hasAllergen = dish.allergens.some((allergen) =>
        filters.dietaryRestrictions!.some((restriction) =>
          allergen.toLowerCase().includes(restriction.toLowerCase())
        )
      );
      if (hasAllergen) return false;
    }

    // Label filter (must have all required labels)
    if (filters.requiredLabels) {
      const hasAllLabels = filters.requiredLabels.every((label) =>
        dish.labels.some((dishLabel) => dishLabel.toLowerCase().includes(label.toLowerCase()))
      );
      if (!hasAllLabels) return false;
    }

    // Mensa filter
    if (filters.preferredMensas && filters.preferredMensas.length > 0) {
      if (!filters.preferredMensas.includes(dish.mensaId)) return false;
    }

    return true;
  });
}

/**
 * Calculate nutritional score based on user goals
 */
export function calculateNutritionalScore(
  dish: MensaDish,
  goals: {
    calorieGoal?: number;
    proteinGoal?: number;
    carbGoal?: number;
    fatGoal?: number;
  }
): number {
  let score = 100;

  if (goals.calorieGoal && dish.calories) {
    const calorieDiff = Math.abs(dish.calories - goals.calorieGoal / 3); // Assuming 3 meals per day
    score -= calorieDiff / 10;
  }

  if (goals.proteinGoal && dish.protein) {
    const proteinDiff = Math.abs(dish.protein - goals.proteinGoal / 3);
    score -= proteinDiff / 2;
  }

  return Math.max(0, Math.min(100, score));
}
