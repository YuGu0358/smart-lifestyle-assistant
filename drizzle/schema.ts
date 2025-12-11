import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Wellness Profile - stores user's health goals and preferences
export const wellnessProfiles = mysqlTable("wellness_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  dailyCalorieGoal: int("daily_calorie_goal"),
  proteinGoal: int("protein_goal"),
  carbGoal: int("carb_goal"),
  fatGoal: int("fat_goal"),
  budgetGoal: int("budget_goal"), // in cents
  dietaryRestrictions: text("dietary_restrictions"), // JSON array
  preferredCuisines: text("preferred_cuisines"), // JSON array
  activityLevel: varchar("activity_level", { length: 32 }),
  sleepGoal: int("sleep_goal"), // in minutes
  homeAddress: text("home_address"), // User's home address for commute planning
  homeLatitude: varchar("home_latitude", { length: 32 }),
  homeLongitude: varchar("home_longitude", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Course Schedule - imported from TUM calendar
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  courseCode: varchar("course_code", { length: 64 }),
  location: varchar("location", { length: 255 }),
  buildingName: varchar("building_name", { length: 255 }),
  roomNumber: varchar("room_number", { length: 64 }),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  dayOfWeek: int("day_of_week"), // 0-6 (Sunday-Saturday)
  recurrenceRule: text("recurrence_rule"), // iCal RRULE format
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Meal History - track user's meal choices and nutrition
export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  mealType: mysqlEnum("meal_type", ["breakfast", "lunch", "dinner", "snack"]).notNull(),
  mensaName: varchar("mensa_name", { length: 255 }),
  dishName: varchar("dish_name", { length: 255 }).notNull(),
  calories: int("calories"),
  protein: int("protein"),
  carbs: int("carbs"),
  fat: int("fat"),
  price: int("price"), // in cents
  consumedAt: timestamp("consumed_at").notNull(),
  rating: int("rating"), // 1-5
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Commute History - track user's commute patterns
export const commutes = mysqlTable("commutes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  fromLocation: varchar("from_location", { length: 255 }).notNull(),
  toLocation: varchar("to_location", { length: 255 }).notNull(),
  fromLat: varchar("from_lat", { length: 32 }),
  fromLng: varchar("from_lng", { length: 32 }),
  toLat: varchar("to_lat", { length: 32 }),
  toLng: varchar("to_lng", { length: 32 }),
  transportMode: varchar("transport_mode", { length: 64 }), // e.g., "U-Bahn", "Bus", "Walking"
  plannedDuration: int("planned_duration"), // in minutes
  actualDuration: int("actual_duration"), // in minutes
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time"),
  routeDetails: text("route_details"), // JSON with MVV route info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Focus Mode Settings - current mode and preferences
export const focusModes = mysqlTable("focus_modes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  currentMode: mysqlEnum("current_mode", ["study", "health", "balanced", "exam"]).default("balanced").notNull(),
  studyPriority: int("study_priority").default(5),
  healthPriority: int("health_priority").default(5),
  socialPriority: int("social_priority").default(5),
  autoSwitchEnabled: int("auto_switch_enabled").default(1), // boolean as int
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// AI Conversation History - chat with AI coordinator
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  context: text("context"), // JSON with relevant data (meal, commute, schedule)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TUM Mensa Dishes - cached menu data
export const mensaDishes = mysqlTable("mensa_dishes", {
  id: int("id").autoincrement().primaryKey(),
  mensaId: varchar("mensa_id", { length: 64 }).notNull(),
  mensaName: varchar("mensa_name", { length: 255 }).notNull(),
  dishName: varchar("dish_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }),
  price: int("price"), // in cents
  calories: int("calories"),
  protein: int("protein"),
  carbs: int("carbs"),
  fat: int("fat"),
  allergens: text("allergens"), // JSON array
  labels: text("labels"), // JSON array (vegetarian, vegan, etc.)
  availableDate: timestamp("available_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WellnessProfile = typeof wellnessProfiles.$inferSelect;
export type InsertWellnessProfile = typeof wellnessProfiles.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;
export type Commute = typeof commutes.$inferSelect;
export type InsertCommute = typeof commutes.$inferInsert;
export type FocusMode = typeof focusModes.$inferSelect;
export type InsertFocusMode = typeof focusModes.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type MensaDish = typeof mensaDishes.$inferSelect;
export type InsertMensaDish = typeof mensaDishes.$inferInsert;

// TUM Account Binding - verified TUM student accounts
export const tumAccounts = mysqlTable("tum_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  tumEmail: varchar("tum_email", { length: 320 }).notNull().unique(),
  studentId: varchar("student_id", { length: 50 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  faculty: varchar("faculty", { length: 200 }),
  isVerified: int("is_verified").default(0).notNull(), // 0 = pending, 1 = verified
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationExpiry: timestamp("verification_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TumAccount = typeof tumAccounts.$inferSelect;
export type InsertTumAccount = typeof tumAccounts.$inferInsert;