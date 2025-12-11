/**
 * OpenMensa API Integration
 * Fetches real-time menu data from Heilbronn Bildungscampus Mensa
 * 
 * API Documentation: https://doc.openmensa.org/api/v2/
 * Canteen ID: 277 (Heilbronn, Mensa Bildungscampus/Europaplatz)
 */

const OPENMENSA_API_BASE = "https://openmensa.org/api/v2";
const HEILBRONN_CANTEEN_ID = 277;

export interface OpenMensaMeal {
  id: number;
  name: string;
  category: string;
  prices: {
    students?: number;
    employees?: number;
    pupils?: number;
    others?: number;
  };
  notes: string[];
}

export interface OpenMensaDay {
  date: string;
  closed: boolean;
}

export interface MealWithNutrition extends OpenMensaMeal {
  estimatedCalories?: number;
  estimatedProtein?: number;
  isVegetarian: boolean;
  isVegan: boolean;
}

/**
 * Fetch menu for a specific date from Heilbronn Mensa
 */
export async function getHeilbronnMenu(date: string): Promise<MealWithNutrition[]> {
  try {
    const url = `${OPENMENSA_API_BASE}/canteens/${HEILBRONN_CANTEEN_ID}/days/${date}/meals`;
    console.log(`[OpenMensa] Fetching menu for ${date} from ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[OpenMensa] No menu available for ${date}`);
        return [];
      }
      throw new Error(`OpenMensa API error: ${response.status} ${response.statusText}`);
    }

    const meals: OpenMensaMeal[] = await response.json();
    
    // Enrich meals with nutrition estimates and dietary labels
    const enrichedMeals: MealWithNutrition[] = meals.map(meal => ({
      ...meal,
      estimatedCalories: estimateCalories(meal),
      estimatedProtein: estimateProtein(meal),
      isVegetarian: isVegetarian(meal),
      isVegan: isVegan(meal),
    }));

    console.log(`[OpenMensa] Found ${enrichedMeals.length} meals for ${date}`);
    return enrichedMeals;
  } catch (error) {
    console.error(`[OpenMensa] Error fetching menu:`, error);
    throw error;
  }
}

/**
 * Get today's menu from Heilbronn Mensa
 */
export async function getTodayMenu(): Promise<MealWithNutrition[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return getHeilbronnMenu(today);
}

/**
 * Check if a meal is vegetarian based on notes
 */
function isVegetarian(meal: OpenMensaMeal): boolean {
  const notes = meal.notes.map(n => n.toLowerCase());
  return notes.some(note => 
    note.includes('vegetarisch') || 
    note.includes('vegetarian') ||
    note.includes('veggie')
  );
}

/**
 * Check if a meal is vegan based on notes
 */
function isVegan(meal: OpenMensaMeal): boolean {
  const notes = meal.notes.map(n => n.toLowerCase());
  return notes.some(note => 
    note.includes('vegan')
  );
}

/**
 * Estimate calories based on meal name and category
 * This is a rough estimation - real nutrition data would be better
 */
function estimateCalories(meal: OpenMensaMeal): number {
  const name = meal.name.toLowerCase();
  const category = meal.category.toLowerCase();

  // Main dishes typically have more calories
  if (category.includes('hauptgericht') || category.includes('main')) {
    if (name.includes('salat') || name.includes('salad')) return 350;
    if (name.includes('suppe') || name.includes('soup')) return 250;
    if (name.includes('pasta') || name.includes('nudel')) return 550;
    if (name.includes('pizza')) return 650;
    if (name.includes('burger')) return 700;
    if (name.includes('schnitzel')) return 600;
    if (name.includes('curry')) return 500;
    if (name.includes('reis') || name.includes('rice')) return 450;
    return 500; // Default for main dishes
  }

  // Side dishes
  if (category.includes('beilage') || category.includes('side')) {
    return 200;
  }

  // Desserts
  if (category.includes('dessert') || category.includes('nachtisch')) {
    return 250;
  }

  return 400; // Default estimate
}

/**
 * Estimate protein content based on meal name
 */
function estimateProtein(meal: OpenMensaMeal): number {
  const name = meal.name.toLowerCase();

  // High protein foods
  if (name.includes('hähnchen') || name.includes('chicken') || name.includes('huhn')) return 35;
  if (name.includes('rind') || name.includes('beef')) return 30;
  if (name.includes('schwein') || name.includes('pork')) return 28;
  if (name.includes('fisch') || name.includes('fish') || name.includes('lachs')) return 32;
  if (name.includes('tofu')) return 20;
  if (name.includes('linsen') || name.includes('lentil')) return 18;
  if (name.includes('bohnen') || name.includes('bean')) return 15;
  if (name.includes('ei') || name.includes('egg')) return 13;

  // Medium protein
  if (name.includes('käse') || name.includes('cheese')) return 12;
  if (name.includes('pasta') || name.includes('nudel')) return 10;

  // Low protein
  if (name.includes('salat') || name.includes('salad')) return 5;
  if (name.includes('gemüse') || name.includes('vegetable')) return 4;

  return 8; // Default estimate
}

/**
 * Get canteen information
 */
export async function getCanteenInfo() {
  try {
    const url = `${OPENMENSA_API_BASE}/canteens/${HEILBRONN_CANTEEN_ID}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenMensa API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[OpenMensa] Error fetching canteen info:`, error);
    throw error;
  }
}
