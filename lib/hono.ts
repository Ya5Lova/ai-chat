import { Hono } from "hono";
import { zundamonAgent } from "./mastra/agent";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "[zundamon] ANTHROPIC_API_KEY is not set. The chat API will fail. " +
      "Set it in .env.local before starting the server."
  );
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

const app = new Hono();

app.post("/api/chat", async (c) => {
  const body = await c.req.json();
  const { messages, threadId } = body as {
    messages: Message[];
    threadId: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages is required" }, 400);
  }
  if (!threadId || typeof threadId !== "string") {
    return c.json({ error: "threadId is required" }, 400);
  }

  let result;
  try {
    result = await zundamonAgent.stream(messages);
  } catch (err) {
    console.error("[zundamon] Failed to start agent stream:", err);
    return c.json({ error: "Failed to connect to AI service" }, 503);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("[zundamon] Stream error:", err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

export default app;
