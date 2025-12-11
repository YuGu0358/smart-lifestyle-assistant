import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("tumAccount API", () => {
  it("should request verification for TUM email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tumAccount.requestVerification({
      tumEmail: "max.mustermann@tum.de",
      studentId: "03123456",
      firstName: "Max",
      lastName: "Mustermann",
      faculty: "Informatics",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Verification code sent");
  });

  it("should reject invalid TUM email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.tumAccount.requestVerification({
        tumEmail: "invalid@gmail.com",
        studentId: "03123456",
      })
    ).rejects.toThrow("Invalid TUM email");
  });

  it("should get TUM account after verification request", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    // Request verification
    await caller.tumAccount.requestVerification({
      tumEmail: "test.student@mytum.de",
      studentId: "03654321",
      firstName: "Test",
      lastName: "Student",
    });

    // Get account
    const account = await caller.tumAccount.get();
    expect(account).toBeDefined();
    expect(account?.tumEmail).toBe("test.student@mytum.de");
    expect(account?.isVerified).toBe(0);
  });
});
