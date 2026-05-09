# Build Plan — ずんだもん AI Chatbot

Ordered execution plan. Work top-to-bottom. Check off each item when done.

---

## Phase 1 — Project Scaffold

- [x] Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir no --import-alias "@/*"`
- [x] Install dependencies: `npm install hono @mastra/core @ai-sdk/anthropic ai` (note: `@mastra/anthropic` does not exist — use `@ai-sdk/anthropic` instead)
- [x] Install dev dependencies: `@types/node` (included by create-next-app)
- [x] Install shadcn/ui: `npx shadcn@latest init -d` (Tailwind v4 auto-detected)
- [x] Add shadcn components: `npx shadcn@latest add input card scroll-area avatar` (button added by init)
- [x] Create `.env.local` with `ANTHROPIC_API_KEY=`
- [x] Add `.env.local` to `.gitignore`
- [x] Verify build passes: `npm run build` ✓

---

## Phase 2 — Mastra Agent (ずんだもん)

- [x] Create `lib/mastra/agent.ts` — define the Zundamon agent with system prompt and `claude-sonnet-4-6`
- [x] Create `lib/mastra/index.ts` — initialize and export the Mastra instance
- [x] Smoke-test the agent locally with a one-off script to confirm Claude responds in character

---

## Phase 3 — API Route (Hono)

- [x] Create `lib/hono.ts` — define Hono app with `POST /api/chat` route
- [x] Implement request validation: require `messages` (array) and `threadId` (string) — note: accepts messages array instead of single message for conversation context
- [x] Call `agent.stream()` from Mastra and pipe the SSE response back to the client
- [x] Create `app/api/chat/route.ts` — mount the Hono app as a Next.js route handler
- [x] Test endpoint with `curl` — SSE streaming and validation errors confirmed

---

## Phase 4 — Chat UI

- [x] Create `components/message-bubble.tsx` — renders one message (role: user | assistant), uses avatar for assistant
- [x] Create `components/chat-window.tsx` — scrollable list of `MessageBubble`, auto-scrolls to bottom on new message
- [x] Create `components/input-bar.tsx` — text input + send button, disabled while streaming, submits on Enter
- [x] Build `app/page.tsx` — composes the three components, holds `messages` state and `threadId` (generated once via `crypto.randomUUID()`)
- [x] Wire up `fetch` call to `POST /api/chat` with SSE reading (`ReadableStream`)
- [x] Append streamed chunks to the last assistant message in real time
- [x] Place `public/zundamon.png` as the avatar image in `MessageBubble` and in the page header

---

## Phase 5 — Styling & Polish

- [x] Set page background to Zundamon green theme (`bg-green-50`)
- [x] Style assistant bubble: `bg-green-200` rounded, left-aligned with avatar
- [x] Style user bubble: `bg-white` border rounded, right-aligned, no avatar
- [x] Add header bar: Zundamon avatar (48px circle) + name "ずんだもん"
- [x] Show a typing indicator (animated dots) while the stream is in progress
- [x] Disable send button and input while streaming
- [x] Handle empty input — do not submit blank messages

---

## Phase 6 — Error Handling & Edge Cases

- [x] Show an error message in the chat if the API call fails
- [x] Handle network timeout gracefully
- [x] Ensure `ANTHROPIC_API_KEY` missing causes a clear server-side error log (not a silent crash)

---

## Phase 7 — Docker & Cloud Run

- [x] Write `Dockerfile` — multi-stage build (builder + runner), expose port 3000
- [x] Write `.dockerignore` — exclude `node_modules`, `.env*`, `.git`
- [x] Build and test Docker image locally: `docker build -t ai-chat . && docker run -p 3000:3000 --env-file .env.local ai-chat`
- [x] Create Google Cloud project and enable Cloud Run API
- [x] Push image: `gcloud builds submit --tag gcr.io/ai-chat-04192320/ai-chat`
- [x] Deploy: `gcloud run deploy ai-chat --image gcr.io/ai-chat-04192320/ai-chat --region asia-northeast1 --allow-unauthenticated`
- [x] Set `ANTHROPIC_API_KEY` via Secret Manager or `--set-env-vars`
- [x] Verify production URL works end-to-end

---

## Phase 8 — Final Checks

- [x] Run `npm run build` with zero errors
- [x] Run `npm run lint` with zero errors
- [x] Run `npx tsc --noEmit` with zero type errors
- [x] Confirm chat resets on page reload (no stale memory)
- [x] Confirm Zundamon responds in character (`〜のだ` endings)
- [x] Confirm streaming text appears incrementally (not all at once)
