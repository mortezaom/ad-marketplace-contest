# Ad Marketplace Contest Submission

## Summary
The app is called "MiniAd" and it's built as a monorepo, includes a backend API using Bun.js and Hono, plus a Next.js frontend for the web (designed to work as a Telegram Mini App). It uses Bun as the runtime, Drizzle ORM for handling the database and changes, and a small shared package for code that both sides can use.

The goal is to create an MVP for an ads marketplace that connects Telegram channel owners (publishers) and advertisers. It handles listing channels, creating ad requests, applying to them, feedbacks for posts, escrow payments, approving creatives, auto-posting ads post, and verifying delivery. This matches the contest's high-level requirements for a two-sided marketplace with escrow and automated flows.


## How It Works
Channel owners can list their channels with prices and verified stats, while advertisers can post campaign requests. Both sides meet in a unified workflow for deals, including chatting (feedbacks), approvals, payments, auto-posting, and fund releases. It supports both entry points (channel listings and advertiser requests) converging into one flow, as required.

### Main Workflow Steps
Here's the end-to-end flow in simple steps (this is one coherent flow as per contest rules, starting from either side but converging into deals):

1. **Channel Owners**: They add their channel to the marketplace. The channel must meet basic rules (like subscriber count). They add a service account as an admin to fetch verified stats (subscribers, average views, language, etc.) from Telegram, and for auto-posting later.

2. **Advertisers Create Requests**: Advertisers make an ad campaign request with details like what they want, budget, and filters (e.g., channel size, language).

3. **Browsing and Applying**: Channel owners browse and filter ad requests. If interested, they apply with their channel. Advertisers can browse channel listings too (for the two-sided flow which is not fully implemented yet).

4. **Review Applications**: Advertisers see applications for their request and accept or reject them.

5. **Deal Creation**: Once accepted, a deal is created. This is the main place for both sides to interact.

6. **Negotiation and Approvals**: Drafts can be shared and both can send feedbacks. Channel owner drafts the ad post (supports formats like posts; others like stories are planned). Advertiser reviews, asks for changes, or approves.

7. **Payment and Escrow**: After approval, advertiser pays into escrow. The system creates a one-time wallet for the payment. Funds are held until delivery is confirmed.

8. **Auto-Posting**: At the agreed time, the approved ad is automatically posted to the channel using the service bot.

9. **Verification**: The system checks if the post is live, not deleted, and stays up for a set time (e.g., 24 hours). It uses Telegram APIs to verify.

10. **Settlement**: If everything is good, funds release to the channel owner’s wallet. If not, refund to advertiser. Deals auto-cancel if they stall (e.g., no activity for too long).

This covers the contest's unified deal flow: Offers catalog → Deal creation → Approvals → Payment/Escrow hold → Auto-posting → Delivery confirmation → Release/Refund.

**Extra Notes**:
- Stats are fetched automatically from Telegram after admin is set on the channel (subscribers, views, language charts, Premium stats, etc.).
- Pricing supports different ad formats (MVP focuses on posts; free-form for flexibility in the future).
- Filters are implemented for browsing (e.g., by price, subscribers, views).
- New wallets per deal, and timeouts for stalled deals.
- For MVP, the advertiser-request flow is fully end-to-end; channel-listing entry is partial (profiles public, direct proposals planned as roadmap).

## System Design and Key Decisions
I went with a monorepo setup to keep things simple. Everything runs on Bun (a fast TypeScript runtime) for both backend and frontend, which speeds up development.

- **Backend**: Hono for lightweight API routes, workers, and queues. Drizzle ORM for typed database changes (migrations).
- **Frontend**: Next.js with app router for simple, component-based UI. Haven't put too much time as backend is the focus.
- **Shared Code**: A package for types and utils to keep things consistent between frontend and backend.
- **Telegram Integration**: Official APIs don't cover everything, so there's a dashboard UI to connect service accounts via phone login (password accounts not supported yet). Sessions are stored for stats, posting, etc.
- **Payments**: Blockchain-based (TON) with fresh wallets per deal. Timers monitor payments; success triggers auto-posting and verification.
- **Wallets**: Channel owners connect in settings; advertisers get a pay button after approval.
- **Env Setup**: One shared `.env` file—easy to manage.
- **Other**: Docker files for easy deployment; Biome for code formatting.

These choices prioritize speed, clean code, and easy setup for the contest. It's MVP-focused: strong architecture for production hardening later, like better security and edge cases.

## Project Structure
Here's a quick overview of the directory structure:

```
.
├── apps
│   ├── backend
│   │   ├── drizzle.config.ts
│   │   ├── migrations     # Database migration files
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── src            # Main backend source code (API, dashboard, etc.)
│   │   ├── storage        # Likely for session/storage data
│   │   └── tsconfig.json
│   └── web
│       ├── components.json
│       ├── LICENSE
│       ├── next.config.ts
│       ├── next-env.d.ts
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── public         # Static assets
│       ├── src            # Frontend source (app, components, etc.)
│       ├── tsconfig.json
│       └── tsconfig.tsbuildinfo
├── biome.json             # Code formatting config
├── bun.lock               # Bun lockfile
├── docker-compose.yml     # For containerized setup
├── Dockerfile.backend     # Docker for backend
├── Dockerfile.web         # Docker for frontend
├── index.ts               # Possible root entry point
├── package.json           # Root package config
├── packages
│   └── shared
│       ├── package.json
│       ├── README.md
│       ├── src            # Shared types/utils
│       └── tsconfig.json
├── README.md              # This file
└── tsconfig.json          # Root TypeScript config
```

This structure uses Bun workspaces for fast local dev and easy sharing.

## Component Overview
- **`apps/backend`**: Core API logic. Handles routes, workers, queues, DB access, and Telegram verification. Key files: `drizzle.config.ts` (DB setup), `src/index.ts` (main entry—assuming based on common patterns), `src/queue/queue-workers.ts` (scheduling/verification—update if exact path differs). Dashboard for service accounts is in `src/dash`.
- **`apps/web`**: Next.js frontend for marketplace UI. Key dirs: `src/app` (routing/pages), `src/components` (UI elements).
- **`packages/shared`**: Shared types and helpers to align backend/frontend (e.g., DTOs).

## Deal Lifecycle (Detailed)
- **Create**: Advertiser starts a deal; system hashes content for later verification.
- **Deposit**: Advertiser pays into escrow (or simulates for demo); backend tracks status.
- **Post**: Auto-posts the approved ad via bot.
- **Verify**: Workers query Telegram to confirm post exists and matches hash.
- **Monitor**: Scheduler checks if post stays live for the duration.
- **Settle**: Release funds on success; refund on failure. Includes auto-cancels for timeouts.

## Environment Variables
Copy `.env.example` to `.env` in the root (if it exists; otherwise create one). These are the minimum needed—fill them before running. Why? They connect services, secure sessions, and enable features like Telegram stats or payments. Without them, the app won't work properly.

- `DATABASE_URL`: Postgres connection string (e.g., `postgres://user:pass@localhost:5432/dbname`). Why: Stores channels, deals, users, etc.
- `JWT_SECRET`: Random secret for JWT auth (e.g., `supersecretkey`). Why: Secures user logins and sessions.
- `NEXT_PUBLIC_API_URL`: Backend API base (e.g., `http://localhost:3000`). Why: Tells frontend where to call the API.
- `BACKEND_PORT`: Backend port (default: 3000). Why: Avoids port conflicts.
- `FRONTEND_ORIGIN`: Frontend origin link to avoid cors errors.
- `TG_BOT_TOKEN`, `TG_API_ID`, `TG_API_HASH`: Telegram credentials. Why: For bot access, stats fetching, and auto-posting.
- (Optional) `TONCENTER_API_KEY`: For TON blockchain. Why: Handles payments without rate limits.


## Running in Dev Mode
To run the whole app locally (backend + frontend), follow these steps. This is for development/testing, with hot reloading for quick changes. Why? It lets you see the full flow end-to-end without deploying.

1. Install dependencies: From root, run `bun install`. Why: Sets up all packages in the monorepo.
2. Set up `.env` as above.
3. Start everything: Run `bun run dev`. Why: Launches both apps via Bun workspaces—backend on port 3000, frontend on port 3333 (configurable).
   - Just frontend: `bun run dev:web`.
   - Just backend: `bun run dev:api`.

Usable URLs after starting:
- Backend API: `http://localhost:3000` (or your `BACKEND_PORT`)—test endpoints here.
- Frontend UI: `http://localhost:3333`—access the marketplace dashboard.
- For Telegram Mini App testing: Link a test bot to the frontend URL (see Telegram docs or contest guidelines).

DB commands (from root):
- Generate migrations: `bun run --filter backend db:generate`.
- Push DB changes: `bun run --filter backend db:push`.
- Apply migrations: `bun run --filter backend db:migrate`.

If running from `apps/backend`, add `--env-file=../../.env` to load the root env.

## Known Limitations and Edge Cases
- Most of the cretical security messures are handled in the app but still need to be a production ready app.
- Some API inputs assume good data; add stricter rules for real use.
- Handles light load; high traffic might cause races ( can be fixed later by integrating cache systems and parallel fetching).
- Fails if Telegram/TON APIs are down (no edge cases and backup/restart mechnism placed for now).
- Focus was backend, so frontend is minimal and functional (not polished).
- MVP has one full flow; some items (e.g., PR manager flow, full ad formats) are simplified or roadmapped.