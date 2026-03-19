# InsurTech Assistant — Alberta Insurance Platform

## Overview
A dual-agent InsurTech platform for Alberta insurance with real AI chatbots, a claims database, and an adjuster dashboard.

## Architecture

### Frontend (React + Vite)
- **Framework**: React with TypeScript, Vite for bundling
- **Routing**: Wouter
- **State/Data**: TanStack Query v5 (all data fetched from API — no localStorage)
- **UI**: Tailwind CSS v4, shadcn/ui components
- **Design**: Navy Blue (`--primary: 220 50% 25%`) + Professional Grey palette, Plus Jakarta Sans font

### Backend (Express + Node.js)
- **Server**: Express on port 5000 (serves both API and Vite dev server)
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (no user API key required)

### Database (PostgreSQL)
- `claims` — stores all FNOL claims from chatbot
- `conversations` / `messages` — chat history tables (from OpenAI blueprint)

## Pages
- `/` — Landing page (Home)
- `/claim` — Claims Specialist chatbot (Alberta FNOL flow: 5 Ws → DCPD/Police → Essential Info → Confirm)
- `/inquiry` — Policy Inquiry chatbot (PDF upload → RAG-style Q&A via OpenAI)
- `/admin` — Adjuster Dashboard (claims queue, two-column review modal with AI chat)
- `/faq` — Alberta Insurance FAQ accordion page

## API Routes
- `GET /api/claims` — List all claims
- `GET /api/claims/:id` — Get single claim
- `POST /api/claims` — Create claim (AI generates summary via OpenAI)
- `PATCH /api/claims/:id` — Update claim fields
- `POST /api/claims/:id/verify` — Verify claim with adjuster name
- `POST /api/claims/:id/chat` — Adjuster mini-chatbot (claim-context-aware, OpenAI)
- `POST /api/inquiry/chat` — Policy inquiry Q&A (PDF text + OpenAI)
- `POST /api/inquiry/escalate` — Flag high-priority inquiry session to dashboard

## Key Files
- `shared/schema.ts` — Drizzle schema for all tables + Zod schemas
- `server/db.ts` — Drizzle database connection
- `server/storage.ts` — Database CRUD operations (IStorage interface)
- `server/routes.ts` — All API routes + OpenAI integration logic
- `client/src/pages/` — All page components
- `client/src/lib/queryClient.ts` — TanStack Query client + apiRequest helper

## AI Features
- **Claims chatbot**: Guided FNOL flow, auto-detects high-priority keywords (lawyer/injury/hospital)
- **Claims summary**: OpenAI generates bullet-point summaries + flags legal risk
- **Adjuster chat**: `/api/claims/:id/chat` — answers strictly from claim data, falls back to "call client"
- **Inquiry chat**: `/api/inquiry/chat` — answers strictly from uploaded PDF text via OpenAI
- **Sentiment escalation**: Legal/complaint keywords in Inquiry chat auto-create High Priority claims

## Environment
- `DATABASE_URL` — PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI Integration endpoint
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit-managed API key
