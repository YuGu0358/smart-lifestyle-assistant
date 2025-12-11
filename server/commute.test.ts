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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("commutes.plan", () => {
  it("should plan a commute route", { timeout: 30000 }, async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.commutes.plan({
      fromName: "TUM Main Building",
      fromLat: 48.1497,
      fromLng: 11.5679,
      toName: "TUM Campus Garching",
      toLat: 48.2627,
      toLng: 11.6679,
      arrivalTime: new Date("2025-11-21T15:00:00Z").toISOString(),
      userPace: "average",
    });

    expect(result).toBeDefined();
    expect(result.routes).toBeDefined();
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.aiAdvice).toBeDefined();
    expect(typeof result.aiAdvice).toBe("string");
  });
});
