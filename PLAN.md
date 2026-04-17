# Build Plan — ずんだもん AI Chatbot

Ordered execution plan. Work top-to-bottom. Check off each item when done.

---

## Phase 1 — Project Scaffold

- [ ] Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir no --import-alias "@/*"`
- [ ] Install dependencies: `npm install hono @mastra/core @mastra/anthropic @ai-sdk/anthropic ai`
- [ ] Install dev dependencies: `npm install -D @types/node`
- [ ] Install shadcn/ui: `npx shadcn@latest init` (choose default style, zinc base color)
- [ ] Add shadcn components: `npx shadcn@latest add button input card scroll-area avatar`
- [ ] Create `.env.local` with `ANTHROPIC_API_KEY=`
- [ ] Add `.env.local` to `.gitignore`
- [ ] Verify dev server starts: `npm run dev`

---

## Phase 2 — Mastra Agent (ずんだもん)

- [ ] Create `lib/mastra/agent.ts` — define the Zundamon agent with system prompt and `claude-sonnet-4-6`
- [ ] Create `lib/mastra/index.ts` — initialize and export the Mastra instance
- [ ] Smoke-test the agent locally with a one-off script to confirm Claude responds in character

---

## Phase 3 — API Route (Hono)

- [ ] Create `lib/hono.ts` — define Hono app with `POST /api/chat` route
- [ ] Implement request validation: require `message` (string) and `threadId` (UUID string)
- [ ] Call `agent.stream()` from Mastra and pipe the SSE response back to the client
- [ ] Create `app/api/chat/route.ts` — mount the Hono app as a Next.js route handler
- [ ] Test endpoint with `curl` or a REST client

---

## Phase 4 — Chat UI

- [ ] Create `components/message-bubble.tsx` — renders one message (role: user | assistant), uses avatar for assistant
- [ ] Create `components/chat-window.tsx` — scrollable list of `MessageBubble`, auto-scrolls to bottom on new message
- [ ] Create `components/input-bar.tsx` — text input + send button, disabled while streaming, submits on Enter
- [ ] Build `app/page.tsx` — composes the three components, holds `messages` state and `threadId` (generated once via `crypto.randomUUID()`)
- [ ] Wire up `fetch` call to `POST /api/chat` with SSE reading (`ReadableStream`)
- [ ] Append streamed chunks to the last assistant message in real time
- [ ] Place `public/zundamon.png` as the avatar image in `MessageBubble` and in the page header

---

## Phase 5 — Styling & Polish

- [ ] Set page background to Zundamon green theme (`bg-green-50`)
- [ ] Style assistant bubble: `bg-green-200` rounded, left-aligned with avatar
- [ ] Style user bubble: `bg-white` border rounded, right-aligned, no avatar
- [ ] Add header bar: Zundamon avatar (48px circle) + name "ずんだもん"
- [ ] Show a typing indicator (animated dots) while the stream is in progress
- [ ] Disable send button and input while streaming
- [ ] Handle empty input — do not submit blank messages

---

## Phase 6 — Error Handling & Edge Cases

- [ ] Show an error message in the chat if the API call fails
- [ ] Handle network timeout gracefully
- [ ] Ensure `ANTHROPIC_API_KEY` missing causes a clear server-side error log (not a silent crash)

---

## Phase 7 — Docker & Cloud Run

- [ ] Write `Dockerfile` — multi-stage build (builder + runner), expose port 3000
- [ ] Write `.dockerignore` — exclude `node_modules`, `.env*`, `.git`
- [ ] Build and test Docker image locally: `docker build -t ai-chat . && docker run -p 3000:3000 --env-file .env.local ai-chat`
- [ ] Create Google Cloud project and enable Cloud Run API
- [ ] Push image: `gcloud builds submit --tag gcr.io/PROJECT_ID/ai-chat`
- [ ] Deploy: `gcloud run deploy ai-chat --image gcr.io/PROJECT_ID/ai-chat --region asia-northeast1 --allow-unauthenticated`
- [ ] Set `ANTHROPIC_API_KEY` via Secret Manager or `--set-env-vars`
- [ ] Verify production URL works end-to-end

---

## Phase 8 — Final Checks

- [ ] Run `npm run build` with zero errors
- [ ] Run `npm run lint` with zero errors
- [ ] Run `npx tsc --noEmit` with zero type errors
- [ ] Confirm chat resets on page reload (no stale memory)
- [ ] Confirm Zundamon responds in character (`〜のだ` endings)
- [ ] Confirm streaming text appears incrementally (not all at once)
