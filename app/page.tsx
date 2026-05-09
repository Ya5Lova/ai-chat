"use client";

import { useState } from "react";
import Image from "next/image";
import ChatWindow from "@/components/chat-window";
import InputBar from "@/components/input-bar";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const threadId =
  typeof crypto !== "undefined" ? crypto.randomUUID() : "thread-1";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    const nextMessages = [...messages, userMessage];

    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, threadId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const chunk = JSON.parse(data) as string;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + chunk },
                ];
              }
              return prev;
            });
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err) {
      const isTimeout =
        err instanceof DOMException && err.name === "AbortError";
      const errorText = isTimeout
        ? "タイムアウトしたのだ。もう一度試してほしいのだ。"
        : "エラーが発生したのだ。もう一度試してほしいのだ。";
      console.error("Chat error:", err);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              content: last.content
                ? last.content + "\n\n" + errorText
                : errorText,
            },
          ];
        }
        return prev;
      });
    } finally {
      clearTimeout(timeoutId);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-green-50">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <Image
          src="/zundamon.png"
          alt="ずんだもん"
          width={48}
          height={48}
          className="rounded-full object-cover"
          priority
        />
        <span className="text-lg font-semibold text-gray-800">ずんだもん</span>
      </header>

      {/* Chat area */}
      <ChatWindow messages={messages} />

      {/* Input */}
      <InputBar onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
