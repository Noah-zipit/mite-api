# mite-api

A small serverless REST API that exposes YouTube search and stream lookups,
built with [youtubei.js](https://github.com/LuanRT/YouTube.js) on Vercel
serverless functions (`api/`). CORS is open so browser clients can call it
directly.

## Endpoints

| Endpoint       | Query params | Returns                          |
|----------------|--------------|----------------------------------|
| `/api`         | `?q=`        | search results                   |
| `/api`         | `?id=`       | best audio stream URL for a video|
| `/api/search`  | `?q=`        | search results                   |
| `/api/watch`   | `?id=`       | best audio + video stream URLs   |

Examples:

```
GET /api?q=atif aslam
GET /api?id=dQw4w9WgXcQ
GET /api/search?q=junaid jamshed naat
GET /api/watch?id=dQw4w9WgXcQ
```

All endpoints answer `OPTIONS` for CORS preflight and return JSON (400 with an
`error` field when a required param is missing).

## Local dev

```bash
npm install
npx vercel dev
```
