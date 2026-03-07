import { generateText } from "ai";
import { inngest } from "./client";
import { google } from "@ai-sdk/google";

export const generateSomething = inngest.createFunction(
  { id: "gemini-generate" },
  { event: "test/gemini.generate" }, // we'll use this to trigger the event
  async ({ step }) => {
    await step.run("generate-text", async () => {
      return await generateText({
        model: google("gemini-2.5-flash"),
        prompt: "generate something to read.",
      });
    });
  },
);
