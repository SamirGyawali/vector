// POST localhost:3000/api/demo/background

import { inngest } from "@/inngest/client";

export async function POST() {
  await inngest.send({
    name: "test/gemini.generate", // match the event name, trigger this inngest-event
    data: {
      prompt: {
        data: "this is the prompt that will be sent to the gemini from code.",
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      },
    },
  });

  return Response.json({ status: "started" });
}
