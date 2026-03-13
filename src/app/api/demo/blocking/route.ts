// POST = in function defination
// localhost:3000/api/demo/blocking

// this is the controller, UI can tirgger this code.
// this code should trigger inngest background job fn

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST() {
  const response = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: "generate something to read.",
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: true,
      recordOutputs: true,
    },
  });

  return Response.json({ response });
}
