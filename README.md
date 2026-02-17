# MiniAd - Telegram Ads Marketplace

A two-sided marketplace connecting Telegram channel owners with advertisers. Built for the Ad Marketplace Contest.

---

## What It Does

- **Channel owners** list their channels with prices and verified stats
- **Advertisers** create campaign requests with budgets and filters
- Both sides meet in a unified workflow: apply → approve → pay → auto-post → verify → settle

---

## How It Works

### For Channel Owners

- Add your channel to the marketplace
- Meet basic rules (minimum subscriber count)
- Add the service account as admin for verified stats and auto-posting
- Browse ad requests and apply with your channel
- Draft ad posts, negotiate with advertisers, get approved
- Receive payment after verified delivery

### For Advertisers

- Create ad campaign requests with details, budget, and filters
- Review applications from channel owners
- Accept or reject applicants
- Approve ad drafts or request changes
- Pay into escrow after approval
- System auto-posts and verifies delivery
- Get refund if delivery fails

---

## Main Workflow

1. **List Channel** → Owner adds channel, system fetches verified stats from Telegram
2. **Create Request** → Advertiser posts campaign with budget and filters
3. **Apply** → Channel owners browse and apply to requests
4. **Review** → Advertiser accepts/rejects applications
5. **Deal Created** → Both parties interact in one place
6. **Draft & Approve** → Owner drafts ad, advertiser reviews and approves
7. **Escrow Payment** → Advertiser pays, funds held until delivery
8. **Auto-Post** → System posts the ad at agreed time
9. **Verification** → System checks post is live and stays up (e.g., 24 hours)
10. **Settlement** → Funds released to owner on success, refunded on failure

---

## Tech Stack

- **Runtime**: Bun (fast TypeScript runtime)
- **Backend**: Hono (lightweight API framework)
- **Frontend**: Next.js with app router
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: TON blockchain with per-deal wallets
- **Code Quality**: Biome for formatting

---

## Project Structure

```
.
├── apps/
│   ├── backend/      # API, workers, dashboard, Telegram integration
│   │   ├── src/      # Main source code
│   │   ├── migrations/
│   │   └── storage/  # Session data
│   └── web/          # Next.js frontend
│       ├── src/      # App, components
│       └── public/
├── packages/
│   └── shared/       # Types and utils for both apps
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.web
└── .env              # Shared environment file
```

---

## Environment Variables

Create a `.env` file in the root directory:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret for JWT auth |
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `BACKEND_PORT` | Backend port (default: 3000) |
| `FRONTEND_ORIGIN` | Frontend origin for CORS |
| `TG_BOT_TOKEN` | Telegram bot token |
| `TG_API_ID` | Telegram API ID |
| `TG_API_HASH` | Telegram API hash |
| `TONCENTER_API_KEY` | (Optional) For TON payments |

---

## Quick Start

```bash
# Install dependencies
bun install

# Start both backend and frontend
bun run dev

# Or run individually
bun run dev:web    # Frontend on port 3333
bun run dev:api    # Backend on port 3000
```

### Database Commands

```bash
# Generate migrations
bun run --filter backend db:generate

# Push schema changes
bun run --filter backend db:push

# Apply migrations
bun run --filter backend db:migrate
```

---

## URLs After Starting

- Backend API: `http://localhost:3000`
- Frontend UI: `http://localhost:3333`
- For Telegram Mini App: Link a test bot to the frontend URL

---

## Key Features

- Verified channel stats (subscribers, views, language) fetched from Telegram
- Filters for browsing (price, subscribers, views)
- New escrow wallet per deal
- Auto-cancel for stalled deals
- Delivery verification via Telegram API
- Dashboard for service account management

---

## Known Limitations (MVP)

- Security is handled but needs production hardening
- Some API inputs need stricter validation
- Built for light load (caching needed for high traffic)
- No fallback if Telegram/TON APIs go down
- Frontend is functional but minimal
- Some features roadmapped (PR manager flow, more ad formats)

---

## Why These Choices

- **Monorepo**: Keeps things simple, shared code between apps
- **Bun everywhere**: Fast development, consistent runtime
- **Hono**: Lightweight, perfect for APIs and workers
- **Drizzle ORM**: Type-safe database operations
- **Per-deal wallets**: Clean payment isolation
- **Single .env**: Easy setup and management

---

Built as an MVP for the Ad Marketplace Contest. Focus was on backend architecture and a clean, working flow.