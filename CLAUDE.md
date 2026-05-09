# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

A Zundamon (ずんだもん) AI chatbot built with Next.js 16, Hono, and Mastra. The agent responds in character — first person 「ぼく」, sentence endings 「〜のだ」「〜なのだ」 — via streaming SSE from Claude.

**Status:** All phases complete ✅. Deployed to Cloud Run at `https://ai-chat-132250008499.asia-northeast1.run.app`. Confirmed working on iPhone, iPad, and desktop.

## Commands

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint (eslint.config.mjs, Next.js rules)
npx tsc --noEmit   # Type-check without emitting
```

**Environment:** Copy `.env.local.example` if it exists, or create `.env.local` with:

```env
ANTHROPIC_API_KEY=sk-...
```

## Architecture

```
Browser
  └── app/page.tsx              # Chat UI — messages state, threadId, SSE fetch
        │ POST /api/chat { messages[], threadId }
        ▼
  app/api/chat/route.ts         # Thin Next.js handler; delegates to Hono
        │
        ▼
  lib/hono.ts                   # Hono router — validates input, calls agent.stream()
        │                         Returns SSE (text/event-stream) with JSON chunks + [DONE]
        ▼
  lib/mastra/agent.ts           # Mastra Agent: zundamonAgent
        │                         Model: "anthropic/claude-sonnet-4-6" (AI Gateway string)
        ▼
  Anthropic Claude API          # Response streamed back through the chain
```

**Key implementation details:**

- `app/api/chat/route.ts` sets `export const runtime = "nodejs"` — required because Hono and Mastra are not edge-compatible.
- `lib/hono.ts` pipes `agent.stream().textStream` into a `ReadableStream` as SSE. Each chunk is `data: "<json-encoded-text>\n\n"`, terminated by `data: [DONE]\n\n`.
- Conversation state is **client-side only** (`useState`). The `threadId` is generated once with `crypto.randomUUID()` and sent on every request, but the server does not persist per-thread history. Full in-memory history is passed in `messages[]` each request.
- `lib/hono.ts` checks `process.env.ANTHROPIC_API_KEY` at startup and logs a clear error if missing.
- Client uses `AbortController` with 30s timeout. On timeout shows 「タイムアウトしたのだ」, on other errors shows 「エラーが発生したのだ」in the chat.

## UI Components

shadcn/ui components (Tailwind v4, no CSS variables setup needed) are in `components/ui/`:

- `avatar`, `button`, `card`, `input`, `scroll-area`

Custom chat components in `components/`:

- `message-bubble.tsx` — user (right, white) / assistant (left, green + avatar). Shows animated bounce dots when content is empty (streaming placeholder).
- `chat-window.tsx` — ScrollArea wrapping MessageBubble list, auto-scrolls to bottom on new message.
- `input-bar.tsx` — Input + send button, disabled while streaming, Enter to submit, blocks empty input.

`lib/utils.ts` exports `cn()` (clsx + tailwind-merge).

## Docker & Cloud Run

```bash
# ローカルビルド
docker build -t ai-chat .
docker run -p 3000:3000 --env-file .env.local ai-chat

# Cloud Run デプロイ（プロジェクト: ai-chat-04192320）
gcloud builds submit --tag gcr.io/ai-chat-04192320/ai-chat .
gcloud run deploy ai-chat \
  --image gcr.io/ai-chat-04192320/ai-chat \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=sk-...
```

**注意点:**
- `next.config.ts` に `output: "standalone"` が必要なのだ
- `.env.local` の値は引用符なしで書くこと（`KEY=value`、`KEY="value"` は Docker で誤動作する）
- `@mastra/core` は Node.js 22+ が必要（警告が出るが動作はする）
- Cloud Build に `roles/storage.admin` の付与が必要な場合がある

## Zundamon Character

System prompt is in `lib/mastra/agent.ts`. Keep responses in character:

- 一人称: 「ぼく」
- 語尾: 「〜のだ」「〜なのだ」
- Tone: bright, cheerful, slightly airheaded spirit who loves zunda mochi.

## Next.js Version Note

This project uses **Next.js 16**, which has breaking API changes from prior versions. Before writing any Next.js-specific code, check `node_modules/next/dist/docs/` for the current API. Do not rely on training data for Next.js APIs.
