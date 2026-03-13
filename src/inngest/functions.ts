import { generateText } from "ai";
import { inngest } from "./client";
import { google } from "@ai-sdk/google";
import { firecrawl } from "@/lib/firecrawl";

const URL_REGEX = /https?:\/\/[^\s]+/g;

export const generateSomething = inngest.createFunction(
  { id: "gemini-generateText" },
  { event: "test/gemini.generate" }, // we'll use this to trigger the event
  async ({ event, step }) => {
    const { prompt } = event.data as { prompt: string };

    const urls = (await step.run("extract-urls", async () => {
      return prompt.match(URL_REGEX) ?? []; // we have .match() method in string to compare against something, here wer're using regex
    })) as string[];

    const scrappedContent = await step.run("scrape-urls", async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          const result = await firecrawl.scrape(url, { formats: ["markdown"] });
          return result.markdown ?? null;
        }),
      );
      return results.filter(Boolean).join("\n\n");
    });

    const finalPrompt = scrappedContent
      ? `Context:\n${scrappedContent}\n\nQuestion:${prompt}`
      : prompt;

    await step.run("generate-text", async () => {
      return await generateText({
        model: google("gemini-2.5-flash"),
        prompt: finalPrompt,
      });
    });
  },
);

export const demoError = inngest.createFunction(
  { id: "demo-error" },
  { event: "demo/error" },
  async ({ step }) => {
    await step.run("fail", async () => {
      throw new Error("Inngest error: Background job failed");
    });
  },
);
