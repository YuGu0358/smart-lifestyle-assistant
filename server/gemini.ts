/**
 * Google Gemini API Integration
 * This module provides functions to interact with Google's Gemini AI model
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
}

/**
 * Call Google Gemini API with a conversation history
 */
export async function callGemini(
  messages: GeminiMessage[],
  config?: GeminiRequest["generationConfig"]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const request: GeminiRequest = {
    contents: messages,
    generationConfig: config || {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No response from Gemini API");
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Simple chat completion with system context
 */
export async function chatWithGemini(
  systemPrompt: string,
  userMessage: string,
  conversationHistory?: GeminiMessage[]
): Promise<string> {
  const messages: GeminiMessage[] = conversationHistory || [];

  // Add system context as first user message if no history
  if (messages.length === 0 && systemPrompt) {
    messages.push({
      role: "user",
      parts: [{ text: systemPrompt }],
    });
    messages.push({
      role: "model",
      parts: [{ text: "Understood. I'm ready to assist you." }],
    });
  }

  // Add current user message
  messages.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  return callGemini(messages);
}

/**
 * Generate meal recommendations based on user profile and preferences
 */
export async function generateMealRecommendations(
  userProfile: {
    calorieGoal?: number;
    proteinGoal?: number;
    dietaryRestrictions?: string[];
    preferredCuisines?: string[];
    budgetGoal?: number;
  },
  availableDishes: {
    dishName: string;
    mensaName: string;
    calories?: number;
    protein?: number;
    price?: number;
    labels?: string[];
  }[],
  context?: string,
  todaysCourses?: {
    courseName: string;
    startTime: Date;
    endTime: Date;
    location?: string;
  }[]
): Promise<string> {
  const systemPrompt = `You are a nutrition and wellness AI assistant for university students. 
Your role is to recommend meals from TUM canteens that align with the user's health goals and preferences.
Always consider nutritional balance, budget constraints, and personal preferences.
Provide practical, friendly advice with specific reasoning.`;

  const dishesInfo = availableDishes
    .map(
      (d, i) =>
        `${i + 1}. ${d.dishName} at ${d.mensaName} - €${((d.price || 0) / 100).toFixed(2)}, ${d.calories || "?"} cal, ${d.protein || "?"}g protein ${d.labels?.length ? `[${d.labels.join(", ")}]` : ""}`
    )
    .join("\n");

  const courseInfo = todaysCourses && todaysCourses.length > 0
    ? `\n\nToday's Schedule:\n${todaysCourses.map(c => `- ${c.courseName}: ${c.startTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} - ${c.endTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}${c.location ? ` at ${c.location}` : ""}`).join("\n")}`
    : "";

  const userMessage = `User Profile:
- Daily calorie goal: ${userProfile.calorieGoal || "not set"}
- Protein goal: ${userProfile.proteinGoal || "not set"}g
- Budget: €${((userProfile.budgetGoal || 0) / 100).toFixed(2)} per meal
- Dietary restrictions: ${userProfile.dietaryRestrictions?.join(", ") || "none"}
- Preferred cuisines: ${userProfile.preferredCuisines?.join(", ") || "any"}${courseInfo}

Available dishes today:
${dishesInfo}

${context ? `Additional context: ${context}` : ""}

Please recommend 2-3 dishes that best match this user's goals${todaysCourses && todaysCourses.length > 0 ? " and consider their class schedule (e.g., suggest quick meals if they have back-to-back classes, or meals near their classroom location)" : ""}. Explain your reasoning.`;

  return chatWithGemini(systemPrompt, userMessage);
}

/**
 * Generate commute suggestions based on schedule and preferences
 */
export async function generateCommuteAdvice(
  userLocation: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number; name: string },
  scheduledTime: Date,
  userPace?: string,
  weatherContext?: string
): Promise<string> {
  const systemPrompt = `You are a smart commute planning assistant for TUM students in Munich.
You help students arrive on time with minimal stress by considering their personal pace, 
weather conditions, and historical traffic patterns. Provide specific, actionable advice.`;

  const userMessage = `Plan a commute:
- From: ${userLocation.name} (${userLocation.lat}, ${userLocation.lng})
- To: ${destination.name} (${destination.lat}, ${destination.lng})
- Scheduled arrival: ${scheduledTime.toLocaleString("de-DE")}
- User's typical pace: ${userPace || "average"}
${weatherContext ? `- Weather: ${weatherContext}` : ""}

Suggest:
1. Recommended departure time
2. Best transport mode (MVV options)
3. Any proactive tips based on the context`;

  return chatWithGemini(systemPrompt, userMessage);
}

/**
 * Generate Focus Mode schedule optimization
 */
export async function optimizeScheduleWithFocusMode(
  focusMode: "study" | "health" | "balanced" | "exam",
  currentSchedule: {
    courses: { name: string; startTime: Date; endTime: Date }[];
    meals: { type: string; time: Date }[];
    commutes: { duration: number; time: Date }[];
  },
  userGoals: {
    studyHours?: number;
    exerciseMinutes?: number;
    sleepHours?: number;
  }
): Promise<string> {
  const systemPrompt = `You are a time management AI coach for university students.
You help optimize daily schedules based on the selected Focus Mode, balancing academic performance 
with personal well-being. Provide specific time blocks and reasoning.`;

  const modeDescriptions = {
    study: "Maximize academic productivity - prioritize deep work sessions during peak cognitive periods",
    health: "Enhance physical and mental well-being - guarantee time for workouts, meal prep, and sufficient sleep",
    balanced: "Default all-around optimization - seek sustainable equilibrium between academics, health, and social life",
    exam: "Peak performance for exams - drastically reduce non-essential activities, schedule intensive revision blocks",
  };

  const scheduleInfo = `Current schedule:
Courses: ${currentSchedule.courses.map((c) => `${c.name} (${c.startTime.toLocaleTimeString()} - ${c.endTime.toLocaleTimeString()})`).join(", ")}
Meals: ${currentSchedule.meals.map((m) => `${m.type} at ${m.time.toLocaleTimeString()}`).join(", ")}
Commutes: ${currentSchedule.commutes.map((c) => `${c.duration}min at ${c.time.toLocaleTimeString()}`).join(", ")}`;

  const userMessage = `Focus Mode: ${focusMode.toUpperCase()}
Mode goal: ${modeDescriptions[focusMode]}

${scheduleInfo}

User goals:
- Study time: ${userGoals.studyHours || "not set"} hours/day
- Exercise: ${userGoals.exerciseMinutes || "not set"} minutes/day
- Sleep: ${userGoals.sleepHours || 8} hours/night

Optimize this schedule according to the Focus Mode. Suggest specific time blocks for study, exercise, 
meals, and rest. Explain how this aligns with the mode's priorities.`;

  return chatWithGemini(systemPrompt, userMessage);
}
