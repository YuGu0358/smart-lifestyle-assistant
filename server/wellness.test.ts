import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("wellness profile API", () => {
  it("should allow updating wellness profile", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.wellness.update({
      dailyCalorieGoal: 2000,
      proteinGoal: 80,
      budgetGoal: 1000,
      dietaryRestrictions: JSON.stringify(["vegetarian"]),
      preferredCuisines: JSON.stringify(["Mediterranean", "Asian"]),
    });

    expect(result).toEqual({ success: true });
  });

  it("should retrieve wellness profile after update", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Update with specific values
    await caller.wellness.update({
      dailyCalorieGoal: 2500,
      proteinGoal: 100,
    });

    // Retrieve and verify
    const profile = await caller.wellness.get();

    expect(profile).toBeDefined();
    if (profile) {
      expect(profile.dailyCalorieGoal).toBeGreaterThan(0);
      expect(profile.proteinGoal).toBeGreaterThan(0);
    }
  });
});
