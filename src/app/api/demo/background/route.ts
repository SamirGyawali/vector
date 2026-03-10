// POST localhost:3000/api/demo/background

import { inngest } from "@/inngest/client";

export async function POST() {
  await inngest.send({
    name: "test/gemini.generate", // match the event name
    data: {},
  });

  return Response.json({ status: "started" });
}
