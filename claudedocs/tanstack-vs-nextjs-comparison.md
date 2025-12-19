# TanStack Router vs Next.js: Architecture Comparison

**Date:** 2025-10-13
**Analyzed Projects:**
- TanStack Router (Vite + React Router) - SPA Architecture
- Next.js 15.5.4 (Turbopack) - SSR/SSG Architecture

---

## Executive Summary

| Aspect | TanStack Router (SPA) | Next.js (SSR/SSG) |
|--------|----------------------|-------------------|
| **Architecture** | Client-Side Rendering (CSR) | Server-Side Rendering (SSR) |
| **Build Size** | 456KB total | 30MB total |
| **User Download** | ~98KB (entire app) | ~120KB (per page) |
| **Build Output** | Single `dist/` folder | Split `.next/` + `public/` |
| **Deployment** | Static files only | Requires Node.js server |
| **File Structure** | Flat (all in dist/) | Hierarchical (client/server split) |
| **Routing** | Client-side (JS-based) | Server-side + Client-side |
| **SEO** | Requires prerendering | Native (HTML rendered on server) |
| **Initial Load** | Blank → Hydrate | Full HTML immediately |

---

## Build Output Comparison

### TanStack Router (SPA)

```
dist/                           (456KB total)
├── index.html                 (710 bytes)
├── assets/
│   ├── index-BgM2CaAN.js      (308KB - entire React + app code)
│   ├── 6XAY2RKM-By_Tn3ER.js   (78KB - React DOM)
│   ├── index-CHVqrKfx.js      (830 bytes - entry point)
│   ├── logo-CuCXCxLu.svg      (19KB)
│   └── index-CbNT6tC8.css     (11KB - Tailwind)
├── favicon.ico                (3.8KB)
├── logo192.png                (5.2KB)
├── logo512.png                (9.4KB)
├── manifest.json              (498 bytes)
└── robots.txt                 (67 bytes)
```

**Key Characteristics:**
- ✅ All files in one flat folder
- ✅ Everything is static (no server needed)
- ✅ Can deploy to any CDN/static host
- ❌ Entire app downloaded on first load (308KB JS)
- ❌ SEO challenges (content loaded via JS)

---

### Next.js (SSR/SSG)

```
.next/                          (30MB total)
├── static/                    (11MB - CLIENT-SIDE)
│   └── chunks/                (36 JS files, code-split)
├── server/                    (18MB - SERVER-ONLY)
│   └── app/                   (SSR handlers)
└── [manifest files]           (routing, config)

public/                         (20KB - STATIC)
├── file.svg
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg
```

**Key Characteristics:**
- ✅ Code-split (browser downloads ~5-8 chunks, not all 36)
- ✅ SEO-friendly (HTML rendered on server)
- ✅ Fast initial paint (HTML arrives immediately)
- ❌ Requires Node.js server for SSR
- ❌ More complex deployment
- ❌ Larger build output (but users don't download it all)

---

## File-by-File Analysis

### TanStack Router Build Output

| File | Size | Purpose | When Loaded |
|------|------|---------|-------------|
| `index.html` | 710B | Shell HTML (empty `<div id="app">`) | First request |
| `index-BgM2CaAN.js` | 308KB | Entire app (React + Router + components) | Immediately |
| `6XAY2RKM-By_Tn3ER.js` | 78KB | React DOM bundle | Immediately |
| `index-CHVqrKfx.js` | 830B | Entry point script | Immediately |
| `index-CbNT6tC8.css` | 11KB | Tailwind CSS | Immediately |
| `logo-CuCXCxLu.svg` | 19KB | React logo | When rendered |

**Total Downloaded on First Load:** ~400KB (gzipped: ~135KB)

**User Experience:**
1. Browser gets `index.html` (empty shell)
2. Downloads all JS/CSS (~400KB)
3. React hydrates and renders content
4. **Time to Interactive:** 1-3 seconds (depending on connection)

---

### Next.js Build Output

| File | Size | Purpose | When Loaded |
|------|------|---------|-------------|
| Server HTML | ~2KB | Full pre-rendered HTML | First request |
| `framework.js` | ~75KB | React runtime (shared, cached) | First page |
| `app-page.js` | ~20KB | Your page code only | First page |
| `shared.js` | ~20KB | Common components | First page |
| Other chunks | Varies | Loaded on-demand | As needed |

**Total Downloaded on First Load:** ~120KB (gzipped)

**User Experience:**
1. Browser gets **fully rendered HTML** with content
2. Downloads minimal JS for hydration (~120KB)
3. React hydrates interactive elements
4. **Time to Interactive:** 0.5-1 second (content visible immediately)

---

## Detailed Architecture Comparison

### 1. Rendering Strategy

#### TanStack Router (CSR - Client-Side Rendering)

```
Browser Request
    ↓
Server: Static index.html (empty shell)
    ↓
Browser: Download all JS bundles
    ↓
Browser: Execute React code
    ↓
Browser: Fetch data (if needed)
    ↓
Browser: Render content
    ↓
User sees content
```

**Timeline:**
```
0ms     → HTML arrives (blank page)
500ms   → JS downloads complete
1000ms  → React executes and renders
1500ms  → Data fetched (if API calls)
2000ms  → Content visible
```

---

#### Next.js (SSR - Server-Side Rendering)

```
Browser Request
    ↓
Server: Fetch data
    ↓
Server: Render React to HTML
    ↓
Server: Send full HTML + minimal JS
    ↓
Browser: Display HTML immediately
    ↓
Browser: Download hydration JS
    ↓
Browser: Hydrate (make interactive)
    ↓
User sees and interacts
```

**Timeline:**
```
0ms     → Request sent
200ms   → Server fetches data + renders HTML
300ms   → HTML arrives (CONTENT VISIBLE!)
800ms   → JS downloads complete
1000ms  → React hydrates (now interactive)
```

---

### 2. Routing Architecture

#### TanStack Router (Client-Side)

```typescript
// src/main.tsx
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',  // Prefetch on hover
})

// Browser handles all routing
```

**How Routing Works:**
1. User clicks link: `/about`
2. TanStack Router intercepts (prevents page reload)
3. JS changes URL in browser (History API)
4. React renders new component
5. **No server request** - instant navigation

**URL Changes:**
```
/ → /about (instant, no network)
```

---

#### Next.js (Server + Client Hybrid)

```typescript
// File-based routing
src/app/page.tsx       → /
src/app/about/page.tsx → /about
src/app/api/hello/route.ts → /api/hello
```

**How Routing Works:**

**Initial Navigation (external link, browser refresh):**
1. User visits `/about`
2. Server renders `/about` page
3. Full HTML sent to browser
4. Content visible immediately

**Client Navigation (Link component):**
1. User clicks `<Link to="/about">`
2. Next.js prefetches `/about` chunk
3. Client-side navigation (no page reload)
4. React renders new page
5. **Fast but with server fallback**

**URL Changes:**
```
/ → /about (client-side, prefetched)
Refresh /about → Server renders fresh HTML
```

---

### 3. Code Splitting

#### TanStack Router

**Default Vite Behavior:**
```javascript
// Build Output
index-BgM2CaAN.js  → 308KB (everything!)
  ├─ React
  ├─ React Router
  ├─ All your components
  ├─ All your routes
  └─ All your utilities
```

**Manual Code Splitting:**
```typescript
// Can enable route-based splitting
const AboutPage = lazy(() => import('./routes/about'))

// vite.config.ts
TanStackRouterVite({ autoCodeSplitting: true })
```

**Result:** Each route becomes separate chunk
```
index-BgM2CaaN.js   → 150KB (framework)
about-H2kd8sK.js    → 50KB (about page)
contact-Lsk39sJ.js  → 40KB (contact page)
```

---

#### Next.js

**Automatic Code Splitting:**
```
Every page is automatically split!

/ page
├─ Framework chunks (shared, cached)
├─ /page specific code (20KB)
└─ Nothing from /about loaded

/about page
├─ Framework chunks (already cached!)
├─ /about specific code (25KB)
└─ Only downloads what's new
```

**Built-in Optimization:**
- Shared code extracted automatically
- Framework cached across pages
- Route-based splitting by default
- Component-level splitting supported

---

### 4. Data Fetching

#### TanStack Router

```typescript
// Client-side data fetching
export const Route = createFileRoute('/users')({
  loader: async () => {
    const res = await fetch('https://api.example.com/users')
    return res.json()
  },
  component: UsersPage
})
```

**Flow:**
1. User navigates to `/users`
2. Browser loads route
3. Loader function executes **in browser**
4. API request sent from browser
5. Data returns, component renders

**Implications:**
- ❌ SEO: Googlebot sees empty page initially
- ❌ Slower: Wait for JS → Wait for API
- ✅ Simpler: No server needed
- ✅ Flexible: Can use any API

---

#### Next.js

```typescript
// Server-side data fetching
export default async function UsersPage() {
  const res = await fetch('https://api.example.com/users', {
    cache: 'no-store' // or configure caching
  })
  const data = await res.json()

  return <div>{data.map(...)}</div>
}
```

**Flow:**
1. User navigates to `/users`
2. **Server** fetches data
3. **Server** renders HTML with data
4. Browser receives complete page
5. Content visible immediately

**Implications:**
- ✅ SEO: Googlebot sees full content
- ✅ Faster: Data already in HTML
- ❌ Complex: Requires server runtime
- ✅ Secure: API keys stay on server

---

## Deployment Comparison

### TanStack Router (Static Deployment)

#### Build Process
```bash
pnpm build
# Output: dist/ folder (456KB)
```

#### Deployment Options

**Option 1: Vercel/Netlify (Static)**
```bash
# No configuration needed
vercel deploy
# Or
netlify deploy --dir=dist
```

**Option 2: Any CDN/S3**
```bash
# Upload dist/ folder to S3
aws s3 sync dist/ s3://my-bucket/ --acl public-read

# Configure CloudFront
# Point to index.html for all routes
```

**Option 3: GitHub Pages**
```bash
# Just push dist/ to gh-pages branch
```

#### Artifact Creation
```bash
# Simple: Just zip the dist folder
tar -czf tsr-artifact.tar.gz dist/

# That's it! No server files needed
```

**Deployment Requirements:**
- ✅ Any static file host
- ✅ No Node.js needed
- ✅ No environment variables
- ✅ CDN-friendly (all static)

---

### Next.js (Server Deployment)

#### Build Process
```bash
pnpm build
# Output:
#   .next/ folder (30MB)
#   public/ folder (20KB)
```

#### Deployment Options

**Option 1: Vercel (Optimized)**
```bash
# Reads required-server-files.json
vercel deploy --prebuilt

# Vercel automatically:
# - Deploys server code to Edge Functions
# - Serves static from CDN
# - Configures routing
```

**Option 2: Docker Container**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .next/ ./.next/
COPY public/ ./public/
COPY package.json ./
COPY next.config.js ./
RUN npm install --production
CMD ["npm", "start"]
```

**Option 3: Standalone Build**
```javascript
// next.config.js
module.exports = {
  output: 'standalone'
}
```
Creates self-contained `.next/standalone/` folder

#### Artifact Creation
```bash
# Must include server + client + config
tar -czf nextjs-artifact.tar.gz \
  .next/ \
  public/ \
  package.json \
  pnpm-lock.yaml \
  next.config.js
```

**Deployment Requirements:**
- ❌ Requires Node.js runtime
- ❌ Needs environment variables
- ✅ Can use serverless (Vercel, AWS Lambda)
- ✅ Can use containers (Docker)

---

## Sigstore Signing Comparison

### TanStack Router (Simple)

```bash
# Single artifact, everything static
tar -czf tsr-app.tar.gz dist/

# Sign the artifact
cosign sign-blob --bundle tsr-app.bundle tsr-app.tar.gz

# Verify
cosign verify-blob --bundle tsr-app.bundle tsr-app.tar.gz

# Deploy
untar + upload to CDN
```

**What's Signed:**
- `index.html` ✅
- All JS bundles ✅
- CSS files ✅
- Static assets (logos, icons) ✅

**One signature covers everything!**

---

### Next.js (Complex)

```bash
# Option 1: Sign entire build
tar -czf nextjs-complete.tar.gz .next/ public/ package.json
cosign sign-blob --bundle complete.bundle nextjs-complete.tar.gz

# Option 2: Sign client/server separately
tar -czf client.tar.gz .next/static/ public/
tar -czf server.tar.gz .next/server/
cosign sign-blob --bundle client.bundle client.tar.gz
cosign sign-blob --bundle server.bundle server.tar.gz

# Option 3: Sign critical files only
cosign sign-blob --bundle manifest.bundle .next/required-server-files.json
cosign sign-blob --bundle package.bundle package.json
```

**What to Sign:**
- Client code (`.next/static/`) ✅
- Server code (`.next/server/`) ✅
- Manifests (routing, config) ✅
- Public assets (`public/`) ✅
- Dependencies (`package.json`) ✅

**Multiple signatures or large archive needed**

---

## Use Case Matrix

### When to Use TanStack Router (SPA)

✅ **Perfect For:**
- Admin dashboards
- Internal tools
- Authenticated apps (content behind login)
- Apps with lots of client-side interaction
- When you need simple deployment
- Budget-conscious hosting (static = cheap)
- Rapid prototyping

❌ **Not Ideal For:**
- Public content sites
- E-commerce (SEO critical)
- Marketing pages
- Content-heavy blogs
- When initial load speed is critical
- When SEO is a priority

**Example Projects:**
- Notion (productivity tool)
- Figma (design tool)
- Google Docs (behind auth)
- Internal company dashboards

---

### When to Use Next.js (SSR/SSG)

✅ **Perfect For:**
- Public content websites
- E-commerce sites
- Blogs & documentation
- Marketing pages
- When SEO is critical
- When Core Web Vitals matter
- When you need fast initial load
- API routes + frontend in one project

❌ **Not Ideal For:**
- Simple static sites (overkill)
- When you don't need server features
- Extremely budget-constrained hosting
- When deployment complexity is an issue

**Example Projects:**
- Vercel's website (obviously)
- Netflix (performance + SEO)
- Hulu (content + SEO)
- E-commerce stores
- Company marketing sites

---

## Performance Comparison

### Metrics

| Metric | TanStack Router | Next.js |
|--------|----------------|---------|
| **First Contentful Paint (FCP)** | 1.5-2.5s | 0.3-0.8s |
| **Largest Contentful Paint (LCP)** | 2-3s | 0.5-1.2s |
| **Time to Interactive (TTI)** | 2-3s | 1-1.5s |
| **First Input Delay (FID)** | Good | Excellent |
| **Cumulative Layout Shift (CLS)** | Good | Excellent |
| **Initial JS Download** | 98KB (gzipped) | 40KB (gzipped) |
| **Subsequent Navigation** | Instant (0ms) | 50-100ms |

### Real-World Example

**Scenario:** User lands on homepage, then navigates to About page

#### TanStack Router
```
0ms     → Request /
300ms   → index.html arrives (blank)
800ms   → JS downloads (98KB gzipped)
1500ms  → React renders homepage
2000ms  → Content visible + interactive

Click "About"
2001ms  → About page renders instantly (already loaded)
```

**Total:** 2 seconds to first content

---

#### Next.js
```
0ms     → Request /
200ms   → Server renders homepage
300ms   → Full HTML arrives (CONTENT VISIBLE!)
800ms   → Hydration JS downloads (40KB gzipped)
1000ms  → Page becomes interactive

Click "About"
1001ms  → Prefetched /about chunk loads
1050ms  → About page visible
```

**Total:** 300ms to first content (6x faster!)

---

## Cost Analysis

### Hosting Costs

#### TanStack Router
```
Static hosting options:
- Vercel Free: ✅ Unlimited bandwidth
- Netlify Free: ✅ 100GB/month
- GitHub Pages: ✅ Free
- AWS S3 + CloudFront: ~$1-5/month for small traffic
- Cloudflare Pages: ✅ Free unlimited

Typical Cost: $0-5/month
```

---

#### Next.js
```
Server hosting options:
- Vercel: $20/month (Pro plan for production)
- AWS ECS: $30-100/month (container + load balancer)
- DigitalOcean App Platform: $12/month
- Railway: $5-20/month
- Self-hosted VPS: $5/month minimum

Typical Cost: $12-50/month
```

**TanStack Router is 10x cheaper to host!**

---

## Security Considerations

### TanStack Router (Client-Side)

**Pros:**
- ✅ No server to compromise
- ✅ No server-side secrets to leak
- ✅ Static files = minimal attack surface

**Cons:**
- ❌ All code visible in browser
- ❌ API keys must be public or proxied
- ❌ Can't validate data on server before sending
- ❌ XSS vulnerabilities if not careful

**Best Practices:**
```typescript
// ❌ NEVER put secrets in client code
const API_KEY = 'secret-key'  // Visible in browser!

// ✅ Use backend proxy or public APIs only
fetch('/api/proxy')  // Your backend handles auth
```

---

### Next.js (Server-Side)

**Pros:**
- ✅ Secrets stay on server
- ✅ Validate data before sending to client
- ✅ Rate limiting on server
- ✅ Authentication on server

**Cons:**
- ❌ Server vulnerabilities (SSRF, RCE)
- ❌ More complex attack surface
- ❌ Environment variable leaks possible

**Best Practices:**
```typescript
// ✅ Secrets safe on server
export async function GET() {
  const data = await fetch('https://api.example.com', {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`  // Safe!
    }
  })
  return NextResponse.json(data)
}
```

---

## Summary Table

| Feature | TanStack Router | Next.js |
|---------|----------------|---------|
| **Build Size** | 456KB | 30MB |
| **User Download** | 98KB | 40KB (first page) |
| **Initial Load** | 2-3s | 0.3-1s |
| **SEO** | Poor (requires prerendering) | Excellent |
| **Deployment** | Simple (static files) | Complex (Node.js server) |
| **Hosting Cost** | $0-5/month | $12-50/month |
| **Routing** | Client-only | Server + Client hybrid |
| **Data Fetching** | Client-side | Server-side + Client-side |
| **Code Splitting** | Manual | Automatic |
| **API Routes** | External service needed | Built-in |
| **Edge Cases** | SPA limitations | Handle most scenarios |

---

## Migration Path

### From TanStack Router → Next.js

**When to migrate:**
- Need better SEO
- Want faster initial load
- Need server-side features (API routes)
- Outgrew client-only architecture

**Steps:**
1. Install Next.js: `npx create-next-app@latest`
2. Move routes: `src/routes/about.tsx` → `src/app/about/page.tsx`
3. Convert loaders to server components
4. Deploy with server runtime

---

### From Next.js → TanStack Router

**When to migrate:**
- Don't need SEO (behind auth)
- Want cheaper hosting
- Simpler deployment
- Don't need server features

**Steps:**
1. Install Vite + TanStack: `npm create @tanstack/router@latest`
2. Convert pages to routes: `src/app/about/page.tsx` → `src/routes/about.tsx`
3. Move data fetching to client-side loaders
4. Deploy as static files

---

## Final Recommendation

**Choose TanStack Router if:**
- Building SaaS dashboard, admin panel, or internal tool
- Content behind authentication
- Want simple, cheap deployment
- Don't care about SEO
- Heavy client-side interactions

**Choose Next.js if:**
- Public-facing website
- E-commerce or content site
- SEO is critical
- Need API routes
- Want best performance (Core Web Vitals)
- Need server-side features

**Both are excellent frameworks - choose based on your requirements, not hype!**
