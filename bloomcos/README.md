# BloomCOS 🌸
One full-stack web app for **cycle tracking, PCOS screening and pregnancy tracking**. Mobile-first UI, user accounts, server-side storage, tests, Docker and CI.

## Features
- **Cycle:** tap-to-log calendar, average cycle length and variation, fertile-window estimate, next-period prediction
- **PCOS screener:** weighted symptom score plus irregular-cycle signal, lifestyle plan, medical disclaimer
- **Pregnancy:** week, trimester, due date, baby size, kick counter, urgent warning signs
- **Daily log:** mood, symptoms, water, notes, symptom insights
- **Accounts:** register and login, per-user data, 30-day sessions, logout

## Run
```bash
npm start        # http://localhost:3000   (Node 18+, nothing to install)
npm test         # 6 API tests
```
Demo login: `demo@bloomcos.app` / `demo123`

## Structure
```
server/server.js   REST API + static hosting (Node http, scrypt hashing, rate limit)
public/index.html  Single-page frontend (offline localStorage fallback if no server)
test/api.test.js   API tests (node:test)
Dockerfile, render.yaml, .github/workflows/ci.yml
```

## API
| Method | Route | Purpose |
|---|---|---|
| POST | /api/register, /api/login | returns `{token,data}` |
| POST | /api/logout | invalidate token |
| GET / PUT | /api/data | load / save user data (Bearer token) |
| GET | /api/health | health check |

## Security
scrypt password hashing with per-user salt, timing-safe compare, random session tokens with expiry, login rate limit (20/min per IP), body size limit, atomic file writes, security headers.

## Deploy
- **Docker:** `docker build -t bloomcos . && docker run -p 3000:3000 -v bloom:/data bloomcos`
- **Render:** connect the GitHub repo; `render.yaml` sets the start command and persistent disk.

## Roadmap
PostgreSQL + Prisma, React + TypeScript frontend, JWT refresh tokens, AI assistant, reminders, trained PCOS model validated by clinicians.

*Educational use only. Not medical advice.*
