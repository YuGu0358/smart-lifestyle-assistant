import { describe, expect, it } from "vitest";
import { chatWithGemini } from "./gemini";

describe("Gemini API Integration", () => {
  it("should successfully call Gemini API with valid credentials", async () => {
    const systemPrompt = "You are a helpful assistant.";
    const userMessage = "Say 'Hello' in one word.";

    const response = await chatWithGemini(systemPrompt, userMessage);

    expect(response).toBeDefined();
    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(0);
  }, 15000); // 15 second timeout for API call
});
