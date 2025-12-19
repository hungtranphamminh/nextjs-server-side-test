# Next.js Manifest Configuration Guide

## Manifest Files Relationship Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BUILD PROCESS                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  pnpm build                                                         │
│      │                                                               │
│      ├──> Compiles src/ → .next/                                    │
│      ├──> Generates manifests                                       │
│      └──> Optimizes assets                                          │
│                                                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MANIFEST GENERATION                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [SOURCE CODE]                [MANIFESTS]                           │
│                                                                      │
│  src/app/page.tsx      ──>    build-manifest.json                   │
│  (React components)            │                                     │
│                                ├─> Maps page → chunks                │
│                                └─> Browser uses for code splitting   │
│                                                                      │
│  next.config.js        ──>    required-server-files.json            │
│  (Configuration)               │                                     │
│                                ├─> Runtime settings                  │
│                                └─> Deployment platforms read this    │
│                                                                      │
│  src/app/layout.tsx    ──>    app-build-manifest.json               │
│  (App structure)               │                                     │
│                                ├─> App Router chunk mappings         │
│                                └─> Client navigation uses this       │
│                                                                      │
│  Routing logic         ──>    routes-manifest.json                  │
│  (rewrites/redirects)          │                                     │
│                                ├─> URL routing rules                 │
│                                └─> Server applies at request time    │
│                                                                      │
│  Static pages          ──>    prerender-manifest.json               │
│  (getStaticProps)              │                                     │
│                                ├─> ISR/SSG configuration              │
│                                └─> Caching strategies                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    RUNTIME USAGE                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [SERVER]                      [CLIENT]                             │
│                                                                      │
│  required-server-files.json    build-manifest.json                  │
│  │                              │                                     │
│  ├─> Read at startup           ├─> Loaded by browser                │
│  ├─> Configure runtime         ├─> Determines chunk loading         │
│  └─> Apply routes              └─> Code-split optimization          │
│                                                                      │
│  routes-manifest.json          app-build-manifest.json              │
│  │                              │                                     │
│  ├─> Process redirects         ├─> Client-side navigation           │
│  ├─> Handle rewrites           ├─> Prefetch optimization            │
│  └─> Apply headers             └─> Dynamic imports                  │
│                                                                      │
│  pages-manifest.json           [Browser Cache]                      │
│  │                              │                                     │
│  ├─> Resolve page modules      ├─> Cache chunks by BUILD_ID         │
│  ├─> SSR page rendering        └─> Invalidate on new deploy         │
│  └─> API route handling                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuration Files That Control Manifests

### 1. `next.config.js` / `next.config.ts`

**Controls:** Almost everything

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output directory - written to required-server-files.json
  distDir: '.next',

  // CDN configuration - affects build-manifest.json paths
  assetPrefix: 'https://cdn.example.com',

  // Subdirectory deployment - affects all URL mappings
  basePath: '/docs',

  // Routing - written to routes-manifest.json
  async redirects() {
    return [
      { source: '/old', destination: '/new', permanent: true }
    ]
  },

  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'https://api.example.com/:path*' }
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Custom-Header', value: 'my-value' }
        ]
      }
    ]
  },

  // Image optimization - written to images-manifest.json
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    domains: ['cdn.example.com']
  },

  // Compression - affects server runtime
  compress: true,

  // Build behavior
  reactStrictMode: true,
  poweredByHeader: false,
  generateEtags: true,

  // Experimental features
  experimental: {
    optimizePackageImports: ['lodash', 'date-fns']
  }
};

export default nextConfig;
```

**Manifest Impact:**
- Changes here regenerate manifests on next build
- `required-server-files.json` contains snapshot of this config
- Deployment platforms read `required-server-files.json` to apply settings

---

### 2. `package.json`

**Controls:** Build metadata

```json
{
  "name": "nextjs",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "15.5.4",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

**Manifest Impact:**
- `.next/package.json` created with `{"type": "commonjs"}`
- Helps identify build as Next.js application
- Dependency versions tracked for reproducibility

---

### 3. Page Components (`src/app/`)

**Controls:** Chunk generation and mapping

```typescript
// src/app/page.tsx
'use client';  // Affects whether code is in server/ or static/

export default function Page() {
  return <div>Content</div>
}
```

**Manifest Impact:**
- `'use client'` → Code goes to `.next/static/chunks/`
- Server Component → Code goes to `.next/server/app/`
- Each page generates entries in `app-build-manifest.json`

---

## Default Mapping Rules (No Config Needed)

Next.js automatically creates these mappings:

### File-Based Routing

```
Source File                  →  URL Route
────────────────────────────────────────────────────────
src/app/page.tsx             →  /
src/app/about/page.tsx       →  /about
src/app/blog/[slug]/page.tsx →  /blog/:slug
src/app/api/hello/route.ts   →  /api/hello
```

**Written to:** `app-path-routes-manifest.json`

### Static Asset Serving

```
Source File                  →  URL Path
────────────────────────────────────────────────────────
public/logo.svg              →  /logo.svg
public/images/hero.png       →  /images/hero.png
public/favicon.ico           →  /favicon.ico
```

**No manifest needed** - Next.js serves `public/` at root automatically

### Built Chunks

```
Source                       →  Output                        →  URL
────────────────────────────────────────────────────────────────────────
src/app/page.tsx            →  .next/static/chunks/page.js   →  /_next/static/chunks/page.js
node_modules/react          →  .next/static/chunks/react.js  →  /_next/static/chunks/react.js
```

**Written to:** `build-manifest.json`, `app-build-manifest.json`

---

## Customizing Manifest Behavior

### Example 1: CDN Integration

**Goal:** Serve static assets from CloudFront

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://d1234.cloudfront.net'
    : '',
};
```

**Effect on Manifests:**

```json
// build-manifest.json (before)
{
  "pages": {
    "/": ["static/chunks/page.js"]
  }
}

// build-manifest.json (after)
{
  "pages": {
    "/": ["https://d1234.cloudfront.net/_next/static/chunks/page.js"]
  }
}
```

**Browser loads from:** `https://d1234.cloudfront.net/_next/static/chunks/page.js`

---

### Example 2: Subdirectory Deployment

**Goal:** Deploy app at `/app` instead of root

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  basePath: '/app',
};
```

**Effect on Manifests:**

```json
// routes-manifest.json
{
  "basePath": "/app"
}

// All routes prefixed automatically
```

**URL Changes:**
```
/              →  /app
/about         →  /app/about
/_next/static/ →  /app/_next/static/
```

---

### Example 3: API Proxy

**Goal:** Proxy `/api/*` to external backend

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://backend.example.com/api/:path*'
      }
    ]
  }
};
```

**Effect on Manifests:**

```json
// routes-manifest.json
{
  "rewrites": {
    "afterFiles": [
      {
        "source": "/api/:path*",
        "destination": "https://backend.example.com/api/:path*"
      }
    ]
  }
}
```

**Runtime:** Server reads this and proxies requests transparently

---

## Manifest Reading Process

### During Build

```
1. next build starts
2. Reads next.config.js
3. Compiles pages and generates chunks
4. Creates manifest files:
   ├─> build-manifest.json (chunk mappings)
   ├─> routes-manifest.json (routing rules)
   ├─> required-server-files.json (runtime config)
   └─> [other manifests]
5. Build complete
```

### During Deployment

```
1. Platform (Vercel/Docker) extracts artifact
2. Reads required-server-files.json
3. Applies configuration:
   ├─> distDir location
   ├─> Environment variables
   ├─> Image optimization settings
   └─> Runtime flags
4. Server starts with manifest-driven config
```

### During Request

```
Browser: GET /
   │
   ├──> Server reads routes-manifest.json
   │    ├─> Apply redirects
   │    ├─> Apply rewrites
   │    └─> Apply headers
   │
   ├──> Server reads pages-manifest.json
   │    └─> Load /page module from .next/server/app/page.js
   │
   ├──> Render HTML + inject build-manifest.json reference
   │
   └──> Browser receives HTML

Browser: Parse HTML
   │
   ├──> Read build-manifest.json
   │    └─> Discover chunks needed for /page
   │
   ├──> Download chunks:
   │    ├─> GET /_next/static/chunks/framework.js
   │    ├─> GET /_next/static/chunks/page.js
   │    └─> GET /_next/static/chunks/shared.js
   │
   └──> Hydrate React app
```

---

## Debugging Manifests

### Check Current Configuration

```bash
# View runtime config
cat .next/required-server-files.json | jq '.config | {distDir, assetPrefix, basePath, compress}'

# View routing rules
cat .next/routes-manifest.json | jq '.redirects, .rewrites, .headers'

# View page chunk mappings
cat .next/app-build-manifest.json | jq '.pages'

# View prerender routes
cat .next/prerender-manifest.json | jq '.routes'
```

### Verify Manifest Integrity

```bash
# Check all manifests exist
ls -l .next/*.json

# Validate JSON syntax
for f in .next/*.json; do
  echo "Checking $f..."
  jq empty "$f" && echo "✅ Valid" || echo "❌ Invalid"
done

# Compare with defaults
next build && diff .next/required-server-files.json .next.backup/required-server-files.json
```

### Trace Manifest Generation

```bash
# Build with debug output
DEBUG=next:* pnpm build

# Watch manifest changes
watch -n 1 'ls -lh .next/*.json'
```

---

## Common Issues & Solutions

### Issue 1: 404 on Static Assets

**Symptom:** `/logo.svg` returns 404

**Check:**
```bash
# Verify file in public/
ls public/logo.svg

# Check basePath setting
cat .next/required-server-files.json | jq '.config.basePath'
```

**Solution:** If `basePath: "/app"`, asset is at `/app/logo.svg`, not `/logo.svg`

---

### Issue 2: Wrong Chunk URLs

**Symptom:** Browser tries to load chunks from wrong domain

**Check:**
```bash
# Check assetPrefix
cat .next/required-server-files.json | jq '.config.assetPrefix'

# Check build manifest
cat .next/build-manifest.json | jq '.pages["/"][0]'
```

**Solution:** Ensure `assetPrefix` matches CDN or leave empty for same-origin

---

### Issue 3: Redirects Not Working

**Symptom:** Custom redirects from `next.config.js` not applied

**Check:**
```bash
# Verify redirects in manifest
cat .next/routes-manifest.json | jq '.redirects'
```

**Solution:**
1. Ensure `next.config.js` is valid
2. Rebuild: `pnpm build`
3. Verify manifest updated

---

## Best Practices

### 1. Version Control

```gitignore
# .gitignore
.next/           ← Build output (don't commit)
```

**Store in git:**
- `next.config.js` ✅
- `package.json` ✅
- Source code ✅

**Don't store in git:**
- `.next/` folder ❌
- Manifest files ❌ (regenerated on build)

### 2. Artifact Creation

```bash
# Include all required files
tar -czf artifact.tar.gz \
  .next/ \
  public/ \
  package.json \
  pnpm-lock.yaml \
  next.config.js

# Exclude unnecessary
tar --exclude='.next/cache' \
    --exclude='node_modules' \
    -czf artifact.tar.gz ...
```

### 3. Environment-Specific Manifests

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? process.env.CDN_URL
    : '',

  compress: process.env.NODE_ENV === 'production',
};
```

**Result:** Different manifest behavior per environment

---

## Summary

**Key Takeaways:**

1. **Manifests are generated** - Don't edit manually, configure via `next.config.js`
2. **Manifest-driven runtime** - Server reads manifests to know how to behave
3. **Three main manifests:**
   - `build-manifest.json` - Browser chunk loading
   - `required-server-files.json` - Server runtime config
   - `routes-manifest.json` - Request routing
4. **Configuration hierarchy:**
   - `next.config.js` → Controls everything
   - Build process → Generates manifests
   - Runtime → Reads manifests
5. **Deployment artifact must include:**
   - `.next/` folder (all manifests + code)
   - `public/` folder (static assets)
   - `package.json` (metadata)

**Most Important File:** `.next/required-server-files.json` - This is the deployment blueprint that tells any platform how to run your Next.js app.
