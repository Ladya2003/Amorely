# Amorely

A private space for couples to stay close — shared memories, chat, calendar, games, and a little life together online.

**Live:** [amorely.love](https://amorely.love)

## Features

- **Feed** — rotating shared photos and memories (birthdays, anniversaries, everyday moments)
- **Chat** — real-time messaging with end-to-end encryption (passphrase unlock)
- **Calendar** — shared events and media from your relationship timeline
- **Games** — quizzes, draw, geo guess, tap games and more for couples
- **Pets** — care for shared virtual pets together
- **Dating ideas** — inspiration for dates and time together
- **News** — product updates and announcements
- **PWA** — installable app with web push notifications
- **i18n** — multi-language UI

## Tech stack

| Layer | Stack |
|--------|--------|
| Client | React, TypeScript, MUI, Socket.IO, i18next |
| Server | Node.js, Express, TypeScript, Socket.IO |
| Database | MongoDB (Mongoose) |
| Media | Cloudinary |
| Auth | JWT |
| Deploy | Client on GitHub Pages · API typically on Render |

## Project structure

```
Amorely/
├── client/          # React frontend
├── server/          # Express API
├── scripts/         # Utility scripts (pets assets, etc.)
├── docker-compose.dev.yml
└── package.json     # Root scripts to run both apps
```

## Prerequisites

- Node.js 18+
- MongoDB (local install or Docker)
- Cloudinary account (for media uploads)
- npm

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/Amorely.git
cd Amorely
npm run install-all
```

### 2. Environment

**Server** — copy `server/.env.example` to `server/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `PORT` | API port (e.g. `8000`) |
| `JWT_SECRET` | Secret for JWT signing |
| `CLIENT_URL` | Frontend origin(s) for CORS (comma-separated) |
| `MONGODB_URI` | MongoDB connection string |
| `CLOUDINARY_*` | Cloudinary credentials |
| `VAPID_*` | Optional — web push (`npm run generate-vapid-keys` in `server`) |
| `CRON_SECRET` | Optional — secret for external cron jobs |

**Client** — copy `client/.env.example` to `client/.env`:

```env
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start MongoDB

With Docker:

```bash
cd server
npm run db:start
```

Or use a local MongoDB instance and point `MONGODB_URI` at it.

### 4. Run the app

From the repo root:

```bash
npm run dev
```

This starts the API and the React client together.

- Client: usually `http://localhost:3000`
- Server: `http://localhost:8000` (or your `PORT`)

### Useful scripts

| Command | Where | What it does |
|---------|--------|----------------|
| `npm run dev` | root | Client + server |
| `npm run client` / `npm run server` | root | Run one side only |
| `npm run db:start` / `db:stop` | server | MongoDB via Docker |
| `npm run generate-vapid-keys` | server | Create VAPID keys for push |
| `npm run fetch:geo-locations` | server | Refresh geo-game locations |

## License

ISC
