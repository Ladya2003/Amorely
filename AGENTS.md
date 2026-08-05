# AGENTS.md — Amorely

Guidance for AI agents working in this repository. Prefer this over scraping `README local.md` (personal notes; may contain secrets — do not commit or echo them).

## Product

Amorely is a private couples app: shared feed/memories, E2EE chat, calendar, games, virtual pets, dating ideas, news, PWA push. Live site: https://amorely.love

Core mental model: most features are **partner-scoped**. Always consider the active `relationship`, partner requests (accept/decline), and breakup (`broken_up`) when changing feed, calendar, chat, or pets.

## Repo layout

```
client/     React + TypeScript (CRA), MUI, Socket.IO client, i18next
server/     Express + TypeScript, Mongoose, Socket.IO, Cloudinary, web-push
scripts/    Root asset utilities (pets images)
```

- Client homepage / deploy: GitHub Pages + custom domain `amorely.love`
- API routes live under `server/src/routes/`; models in `server/src/models/`
- Main UI routes: Feed, Chat (+ games), Calendar, News, Settings, Pets, Dating ideas, Admin

## Commands

```bash
npm run install-all   # root + client + server
npm run dev           # API + client (from root)
cd server && npm run db:start   # Mongo via docker-compose.dev.yml
```

Env templates: `server/.env.example`, `client/.env.example`. Never invent or commit real secrets.

## Domains agents touch often

| Area | Where to look | Notes |
|------|----------------|-------|
| Auth / user | `server/src/routes/auth.ts`, `models/user.ts`, `client/src/contexts/` | JWT; settings via `/api/settings` |
| Relationships | `routes/relationships.ts`, `models/relationship.ts`, `partnerRequest.ts` | Pairing is request → accept/decline |
| Feed rotation | `routes/feed.ts`, `models/feedRotationState.ts`, `models/content.ts` | Slots: birthday / anniversary / random; regenerate ~02:00 and 17:00 user TZ |
| Chat + realtime | `routes/chat.ts`, `models/message.ts`, Socket.IO | Server stores `encryptedPayload`, not plaintext |
| E2EE | `server/src/routes/crypto.ts`, `client/src/crypto/`, `CryptoUnlockPage` | Passphrase unlock; treat as security-sensitive |
| Calendar | `routes/calendar.ts` | Events + media; feeds content into shared memories |
| Games | `routes/games.ts`, game state models, `client/src/pages/*Game*` | Quiz, draw, geo, tap, etc. |
| Pets / currency | `routes/pets.ts`, `currency.ts`, pet models | In-app currency: AmoreCoins |
| i18n | `client/src/locales/{en,ru,uk,de,es,fr,pt}.json` | User-facing strings go in locale files, not hardcoded |

## Coding conventions

- Match existing patterns in the file you edit; do not drive-by refactor unrelated code.
- Keep imports at the top of the module (no inline imports).
- TypeScript: for switches over unions/enums, handle all cases; use `never` in `default`.
- Prefer focused diffs: no unsolicited docs, no drive-by renames.
- Client UI: follow existing MUI / Layout patterns in `client/src/components/Layout/`.
- New user-visible copy: update **all** locale files when practical; at least `en.json` + `ru.json`.
- API changes: keep route → model → client service (`client/src/services/`) in sync.

## Security & privacy (do not regress)

- Do not log, print, or commit passphrases, JWT secrets, VAPID keys, Mongo URIs, or test account credentials.
- Chat: do not add server-side decryption of message payloads; E2EE stays client-side.
- Crypto changes need careful review (keys in IndexedDB, device records, backups).
- Cron endpoints use `CRON_SECRET`; do not weaken that check.
- `README local.md` is gitignored — do not reintroduce secrets into tracked files.

## Feed rotation (short)

- Priority content: birthday window, then anniversary window, then random shared media.
- Random selection uses `FeedRotationState` (`items` + `showCount`, `currentSlots`, `lastGeneratedSlot`).
- Respect relationship status: after breakup, only show content the user themselves added (see existing feed logic).
- Manual debug: clearing / adjusting `lastGeneratedSlot` forces a new generation cycle — do not change this lightly in production data.

## What not to do

- Do not put exploit PoCs, malware, or attack scripts in the repo.
- Do not commit `.env` or Cloudinary / push credentials.
- Do not “simplify” E2EE by storing plaintext messages on the server.
- Do not expand scope into large TODOs from personal notes unless the user asks.

## When unsure

Ask the user, or inspect the nearest similar feature (route + model + page/service) and mirror it.
