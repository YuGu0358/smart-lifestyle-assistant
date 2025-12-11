import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Wellness Profile queries
export async function getWellnessProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { wellnessProfiles } = await import("../drizzle/schema");
  const result = await db.select().from(wellnessProfiles).where(eq(wellnessProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertWellnessProfile(userId: number, profile: any) {
  const db = await getDb();
  if (!db) return;
  const { wellnessProfiles } = await import("../drizzle/schema");
  await db.insert(wellnessProfiles).values({ userId, ...profile }).onDuplicateKeyUpdate({ set: profile });
}

// Course queries
export async function getUserCourses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { courses } = await import("../drizzle/schema");
  return db.select().from(courses).where(eq(courses.userId, userId));
}

export async function insertCourse(course: any) {
  const db = await getDb();
  if (!db) return;
  const { courses } = await import("../drizzle/schema");
  await db.insert(courses).values(course);
}

export async function deleteUserCourses(userId: number) {
  const db = await getDb();
  if (!db) return;
  const { courses } = await import("../drizzle/schema");
  await db.delete(courses).where(eq(courses.userId, userId));
}

// Meal queries
export async function getUserMeals(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const { meals } = await import("../drizzle/schema");
  const { and, gte, lte } = await import("drizzle-orm");
  
  let query = db.select().from(meals).where(eq(meals.userId, userId));
  
  if (startDate && endDate) {
    query = db.select().from(meals).where(
      and(
        eq(meals.userId, userId),
        gte(meals.consumedAt, startDate),
        lte(meals.consumedAt, endDate)
      )
    );
  }
  
  return query;
}

export async function insertMeal(meal: any) {
  const db = await getDb();
  if (!db) return;
  const { meals } = await import("../drizzle/schema");
  await db.insert(meals).values(meal);
}

// Commute queries
export async function getUserCommutes(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  const { commutes } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(commutes).where(eq(commutes.userId, userId)).orderBy(desc(commutes.departureTime)).limit(limit);
}

export async function insertCommute(commute: any) {
  const db = await getDb();
  if (!db) return;
  const { commutes } = await import("../drizzle/schema");
  await db.insert(commutes).values(commute);
}

// Focus Mode queries
export async function getFocusMode(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { focusModes } = await import("../drizzle/schema");
  const result = await db.select().from(focusModes).where(eq(focusModes.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertFocusMode(userId: number, mode: any) {
  const db = await getDb();
  if (!db) return;
  const { focusModes } = await import("../drizzle/schema");
  await db.insert(focusModes).values({ userId, ...mode }).onDuplicateKeyUpdate({ set: mode });
}

// Conversation queries
export async function getUserConversations(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  const { conversations } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt)).limit(limit);
}

export async function insertConversation(conversation: any) {
  const db = await getDb();
  if (!db) return;
  const { conversations } = await import("../drizzle/schema");
  await db.insert(conversations).values(conversation);
}

// Mensa Dishes queries
export async function getMensaDishes(date: Date) {
  const db = await getDb();
  if (!db) return [];
  const { mensaDishes } = await import("../drizzle/schema");
  const { gte, lt } = await import("drizzle-orm");
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db.select().from(mensaDishes).where(
    gte(mensaDishes.availableDate, startOfDay)
  );
}

export async function insertMensaDishes(dishes: any[]) {
  const db = await getDb();
  if (!db) return;
  const { mensaDishes } = await import("../drizzle/schema");
  if (dishes.length > 0) {
    await db.insert(mensaDishes).values(dishes);
  }
}

// TUM Account queries
export async function getTumAccountByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { tumAccounts } = await import("../drizzle/schema");
  const result = await db.select().from(tumAccounts).where(eq(tumAccounts.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTumAccountByEmail(tumEmail: string) {
  const db = await getDb();
  if (!db) return undefined;
  const { tumAccounts } = await import("../drizzle/schema");
  const result = await db.select().from(tumAccounts).where(eq(tumAccounts.tumEmail, tumEmail)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTumAccount(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { tumAccounts } = await import("../drizzle/schema");
  await db.insert(tumAccounts).values(data);
}

export async function updateTumAccount(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { tumAccounts } = await import("../drizzle/schema");
  await db.update(tumAccounts).set(data).where(eq(tumAccounts.userId, userId));
}
