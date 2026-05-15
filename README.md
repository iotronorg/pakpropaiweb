# PakProp AI — Web Dashboard

Next.js web dashboard for PakProp AI — the trust infrastructure layer for Pakistani real estate.

Role-based dashboards for Admins, Agents, and Developer organizations.

> This is the **secondary interface**. The primary user experience is WhatsApp-based.
> This dashboard is for internal operators: admins, agents, and developer organizations.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Running Locally with Docker](#running-locally-with-docker)
- [Running Locally without Docker (npm)](#running-locally-without-docker-npm)
- [Environment Variables Reference](#environment-variables-reference)
- [Deploying to Production](#deploying-to-production)
  - [Option A — Vercel (recommended, zero-config)](#option-a--vercel-recommended)
  - [Option B — Docker on Render / Railway / VPS](#option-b--docker-on-render--railway--vps)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### For running with Docker

| Tool | Version | Install |
|---|---|---|
| Docker Desktop | 24+ | https://docs.docker.com/get-docker/ |

### For running without Docker (npm)

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | included with Node.js |

> The backend (`pakpropai`) must be running before using this dashboard.
> See `pakpropai/README.md` to start the backend.

---

## Running Locally with Docker

This is the recommended approach — no Node.js installation required.

### 1. Clone and enter the directory

```bash
git clone <your-repo-url>
cd pakpropaiweb
```

### 2. Create your `.env.local` file

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

This points the dashboard to the backend running locally via Docker.

### 3. Create a `Dockerfile` for the frontend

The frontend does not include a Dockerfile yet. Create one in the `pakpropaiweb/` directory:

```dockerfile
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Also add this to `next.config.ts` to enable standalone output (required for the Docker runner stage):

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // add this line
  images: { ... },       // keep existing config
};
```

### 4. Create a `docker-compose.yml` for the frontend

Create `docker-compose.yml` in the `pakpropaiweb/` directory:

```yaml
services:
  web:
    build:
      context: .
      args:
        NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
```

### 5. Build and start

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 \
  -t pakpropaiweb .

docker run -p 3000:3000 pakpropaiweb
```

Or with Docker Compose:

```bash
docker compose up --build
```

### 6. Open the dashboard

http://localhost:3000

You will be redirected to `/login`. Enter your phone number to receive an OTP via WhatsApp (requires backend to be running with WhatsApp configured).

---

## Running Locally without Docker (npm)

This is faster for active frontend development with hot reload.

### 1. Install dependencies

```bash
cd pakpropaiweb
npm install
```

### 2. Create your `.env.local` file

```bash
cp .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Start the development server

```bash
npm run dev
```

The dashboard is available at http://localhost:3000

The backend must be running on port 8000. See `pakpropai/README.md` — start the backend with `docker compose up` first.

### 4. Build for production (optional, local test)

```bash
npm run build
npm start
```

---

## Environment Variables Reference

```env
# Required — points to the Django backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

That is the only environment variable. The prefix `NEXT_PUBLIC_` makes it available in the browser bundle.

| Environment | Value |
|---|---|
| Local (backend via Docker) | `http://localhost:8000/api/v1` |
| Local (backend via npm) | `http://localhost:8000/api/v1` |
| Production (Render backend) | `https://pakpropai-api.onrender.com/api/v1` |
| Production (your domain) | `https://api.yourdomain.com/api/v1` |

> `NEXT_PUBLIC_API_URL` is embedded at **build time**, not runtime. You must rebuild the app after changing it.

---

## Deploying to Production

---

### Option A — Vercel (recommended)

Vercel is the zero-configuration deployment platform built for Next.js. The repo includes `vercel.json` with security headers already configured.

#### Steps

**1. Push your code to GitHub.**

**2. Go to [vercel.com](https://vercel.com) → New Project → Import your repository.**

Vercel auto-detects Next.js and configures the build command (`npm run build`) and output directory (`.next`).

**3. Set the environment variable.**

In the Vercel project settings → Environment Variables → Add:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api/v1` | Production |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Development, Preview |

> Use your actual backend domain. If using Render for the backend, this is `https://pakpropai-api.onrender.com/api/v1`.

**4. Click Deploy.**

Vercel builds and deploys automatically. Every push to your main branch triggers a new deployment.

**5. Configure your custom domain (optional).**

Vercel dashboard → Your project → Settings → Domains → Add domain.

**6. Update backend CORS settings.**

In your backend environment variables, set:

```env
FRONTEND_URL=https://your-vercel-app.vercel.app
# or your custom domain:
FRONTEND_URL=https://app.yourdomain.com
```

This tells Django to allow requests from your deployed frontend.

#### Cost on Vercel

Free tier: unlimited deployments, 100GB bandwidth/month — sufficient for MVP.

#### What `vercel.json` does

The included `vercel.json` sets production security headers on all responses:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

### Option B — Docker on Render / Railway / VPS

Use this if you want to keep the frontend and backend on the same platform, or if you prefer self-hosting.

#### Create the Dockerfile (if not done yet)

Add this `Dockerfile` to the `pakpropaiweb/` directory:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Enable standalone output in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [ ... ],  // keep existing
  },
};
```

#### Deploy on Render

**1. Go to Render → New → Web Service → Connect repository.**

**2. Configure:**

| Setting | Value |
|---|---|
| Runtime | Docker |
| Dockerfile Path | `./Dockerfile` |
| Docker Context | `.` |

**3. Set environment variable:**

```
NEXT_PUBLIC_API_URL = https://pakpropai-api.onrender.com/api/v1
```

Pass it as a Docker build argument in Render settings → Docker build args:

```
NEXT_PUBLIC_API_URL=https://pakpropai-api.onrender.com/api/v1
```

**4. Deploy.**

#### Deploy on Railway

**1. New Project → Deploy from GitHub → Select pakpropaiweb.**

**2. Railway auto-detects the Dockerfile.**

**3. Set the build argument:**

Variables tab → add:

```
NEXT_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api/v1
```

**4. Click Deploy.**

#### Deploy on a VPS

```bash
# On your server:
cd /opt/pakpropaiweb

docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 \
  -t pakpropaiweb .

docker run -d \
  --name pakpropaiweb \
  --restart always \
  -p 127.0.0.1:3000:3000 \
  pakpropaiweb
```

Set up Nginx to proxy port 3000:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name app.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Get SSL: `sudo certbot --nginx -d app.yourdomain.com`

---

## Post-Deployment Checklist

After deploying to production, verify these before sharing the URL:

**1. Confirm backend CORS is updated**

The backend's `FRONTEND_URL` environment variable must match your deployed frontend URL exactly (including `https://` and no trailing slash):

```env
FRONTEND_URL=https://app.yourdomain.com
```

Without this, login will fail with CORS errors in the browser console.

**2. Test the login flow**

1. Open your deployed URL
2. You should be redirected to `/login`
3. Enter a phone number → receive OTP via WhatsApp → enter code
4. You should be redirected to `/admin`, `/agent`, or `/developer` based on your role

**3. Verify role-based routing**

| Role | Redirects to |
|---|---|
| admin | `/admin` |
| agent | `/agent` |
| developer | `/developer` |
| client | `/login` (clients do not have dashboard access) |

**4. Confirm image loading works**

If using Cloudflare R2 for media, property images should load from your R2 public URL. The `next.config.ts` includes `*.r2.dev` in the allowed remote image patterns.

**5. Test a full dashboard action**

- Log in as admin
- Navigate to **Settings** — verify system config loads
- Navigate to **Leads** — verify the leads list loads
- Navigate to **Agents** — verify agent list loads

**6. Cross-origin cookie check (production only)**

If the frontend and backend are on different domains (e.g., `app.pakpropai.com` and `api.pakpropai.com`), cookies must use `SameSite=None; Secure`. Ensure the backend's production settings include:

```python
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = True
```

This requires HTTPS on both domains.

> Alternatively, host both on the same domain using a path proxy (e.g., `yourdomain.com/api` → backend, `yourdomain.com` → frontend) to avoid cross-origin cookie issues entirely.
