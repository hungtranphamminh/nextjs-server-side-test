# Development vs Production: How Files Are Served

**What You're Seeing in DevTools Explained**

---

## The Confusion You Encountered

You ran `npm run dev` and saw **source files** in DevTools, not the built files. This is normal! Here's why:

### Development Mode (`npm run dev`)
```bash
npm run dev
# Opens http://localhost:3000
# DevTools shows: src/routes/index.tsx (source files!)
```

**What's happening:**
- ✅ Vite serves your **TypeScript source files directly**
- ✅ No bundling, no minification
- ✅ Hot Module Replacement (HMR) for instant updates
- ❌ Not how production works!

### Production Mode (`npm run build` → `npm run start`)
```bash
npm run build
# Creates .output/ folder

npm run start
# Opens http://localhost:3000
# DevTools shows: assets/main-*.js (bundled files!)
```

**What's happening:**
- ✅ Vite bundles everything
- ✅ Minified, optimized JavaScript
- ✅ This is what users actually download
- ❌ No source files visible (unless you use source maps)

---

## Visual Comparison

### Development Mode Flow

```
Browser Request
    ↓
http://localhost:3000
    ↓
Vite Dev Server (on-the-fly compilation)
    ├─> Transforms TypeScript → JavaScript
    ├─> Injects HMR client
    └─> Serves source files directly
    ↓
Browser DevTools Sources Tab:
├─ localhost:3000
│  ├─ @id/
│  │  └─ client.tsx (SOURCE FILE!)
│  ├─ @vite/
│  │  └─ client (Vite HMR)
│  └─ src/
│     ├─ routes/
│     │  ├─ index.tsx (SOURCE FILE!)
│     │  └─ __root.tsx (SOURCE FILE!)
│     ├─ components/
│     └─ router.tsx
```

**Browser downloads:**
- TypeScript files (transformed to JS on-the-fly)
- Vite HMR client
- Source maps for debugging

**File sizes:** Larger (no minification)

---

### Production Mode Flow

```
npm run build
    ↓
Vite Build Process
    ├─> Bundles all code
    ├─> Minifies JavaScript
    ├─> Optimizes assets
    ├─> Code splitting
    └─> Creates .output/
    ↓
.output/
├─ public/assets/
│  ├─ main-DzvKBgP-.js (343KB - BUNDLED!)
│  ├─ 6XAY2RKM-DQ9Wd0m1.js (76KB - React DOM)
│  └─ styles-D0UYo-87.css (31KB)
└─ server/
   └─ index.mjs (Node.js server)
    ↓
node .output/server/index.mjs
    ↓
Browser DevTools Sources Tab:
├─ localhost:3000
│  └─ assets/
│     ├─ main-DzvKBgP-.js (MINIFIED!)
│     └─ 6XAY2RKM-DQ9Wd0m1.js (MINIFIED!)
```

**Browser downloads:**
- Minified bundles only
- No source files
- Much smaller file sizes

---

## CSR vs SSR Production Serving

### TanStack Router (CSR) - Production

```bash
# Build
npm run build
# Creates: dist/ (456KB)

# Serve
npm run serve  # OR vite preview
# ✅ Works! Port 4173
```

**Why it works:**
- `vite preview` serves static files
- All files in `dist/` are static
- No server-side rendering needed

**File Serving:**
```
GET /                → dist/index.html
GET /about           → dist/index.html (SPA routing)
GET /assets/main.js  → dist/assets/index-BgM2CaAN.js
```

---

### TanStack Start (SSR) - Production

```bash
# Build
npm run build
# Creates: .output/ (4.5MB)

# Serve
npm run serve  # ❌ WRONG! vite preview doesn't work for SSR
node .output/server/index.mjs  # ✅ Correct!
```

**Why `vite preview` fails:**
- `vite preview` is for static files only
- SSR apps need Node.js runtime
- `.output/server/` contains server code
- Must run the Node.js server

**File Serving:**
```
GET /                → Server executes .output/server/chunks/_/index-*.mjs
                     → Renders HTML with content
                     → Returns full HTML

GET /about           → Server executes .output/server/chunks/_/about-*.mjs
                     → Renders HTML for /about
                     → Returns full HTML

GET /assets/main.js  → .output/public/assets/main-DzvKBgP-.js (static)
```

---

## Fixing Your Scripts

### CSR (TanStack Router)

```json
{
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build && tsc",
    "serve": "vite preview"  // ✅ Works for static builds
  }
}
```

**Usage:**
```bash
npm run build   # Creates dist/
npm run serve   # Opens http://localhost:4173
```

---

### SSR (TanStack Start)

```json
{
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "start": "node .output/server/index.mjs",  // ✅ Add this!
    "serve": "vite preview"  // ❌ Doesn't work for SSR
  }
}
```

**Usage:**
```bash
npm run build   # Creates .output/
npm run start   # Opens http://localhost:3000 (SSR server)
```

---

## What You See in DevTools

### Development Mode (`npm run dev`)

**Network Tab:**
```
Name                          Size      Type
──────────────────────────────────────────────
localhost:3000                 2.1 KB   document
@vite/client                   15.2 KB  script
src/routes/index.tsx           823 B    script
src/routes/__root.tsx          456 B    script
src/components/Header.tsx      1.2 KB   script
src/router.tsx                 3.4 KB   script
```

**Sources Tab:**
```
localhost:3000
├─ @id/
│  └─ client.tsx
├─ @vite/
│  └─ client
├─ @react-refresh
└─ src/
   ├─ routes/
   │  ├─ index.tsx    ← SOURCE FILES!
   │  └─ __root.tsx
   ├─ components/
   │  └─ Header.tsx
   └─ router.tsx
```

**Characteristics:**
- ✅ Readable code
- ✅ Full TypeScript syntax
- ✅ Comments preserved
- ✅ Source maps included
- ❌ NOT production-ready

---

### Production Mode (`npm run start`)

**Network Tab:**
```
Name                          Size      Type
──────────────────────────────────────────────
localhost:3000                 2.8 KB   document (with content!)
main-DzvKBgP-.js               111 KB   script (gzipped)
6XAY2RKM-DQ9Wd0m1.js           33 KB    script (gzipped)
styles-D0UYo-87.css            5.5 KB   stylesheet (gzipped)
```

**Sources Tab:**
```
localhost:3000
└─ assets/
   ├─ main-DzvKBgP-.js    ← MINIFIED!
   └─ 6XAY2RKM-DQ9Wd0m1.js
```

**Content of main-DzvKBgP-.js:**
```javascript
!function(){var e={...},t=...;function n(e){return...}}();
// Unreadable minified code!
```

**Characteristics:**
- ✅ Optimized for production
- ✅ Minified (smaller download)
- ✅ Tree-shaken (unused code removed)
- ❌ Not readable without source maps
- ❌ No TypeScript

---

## Why Development Serves Source Files

### Reason 1: Fast Refresh (HMR)

When you change a file:

**Production Build (slow):**
```
Edit src/App.tsx
    ↓
npm run build (10-30 seconds)
    ↓
Refresh browser
```

**Development Mode (instant):**
```
Edit src/App.tsx
    ↓
Vite detects change (< 50ms)
    ↓
HMR updates only changed module
    ↓
Browser updates automatically
```

### Reason 2: Better Debugging

**Production (minified):**
```javascript
function a(b){return b.map(c=>c+1)}
// What are a, b, c?
```

**Development (readable):**
```typescript
function incrementNumbers(numbers: number[]): number[] {
  return numbers.map(num => num + 1)
}
// Clear variable names!
```

### Reason 3: Detailed Error Messages

**Production:**
```
Uncaught TypeError: Cannot read property 'x' of undefined
  at a (main.js:1:2345)
```

**Development:**
```
Uncaught TypeError: Cannot read property 'map' of undefined
  at incrementNumbers (src/utils/math.ts:15:12)
  at UserList (src/components/UserList.tsx:23:18)
```

---

## How Vite Serves Files

### Development Server Architecture

```
┌─────────────────────────────────────────────┐
│  Vite Dev Server (Port 3000)                │
├─────────────────────────────────────────────┤
│                                             │
│  Browser requests: src/App.tsx              │
│         ↓                                   │
│  Vite Plugin Pipeline:                      │
│  1. TypeScript transform                    │
│  2. React JSX transform                     │
│  3. HMR injection                           │
│  4. Source map generation                   │
│         ↓                                   │
│  Returns: Transformed JavaScript            │
│                                             │
│  Cache: Stores transformed files            │
│  (instant on next request)                  │
│                                             │
└─────────────────────────────────────────────┘
```

**On-the-fly transformation:**
```
Browser: GET /src/App.tsx
    ↓
Vite: Read src/App.tsx
    ↓
Vite: Transform TypeScript → JavaScript
    ↓
Vite: Add HMR code
    ↓
Vite: Return JavaScript to browser
```

---

### Production Build Process

```
┌─────────────────────────────────────────────┐
│  Vite Build (npm run build)                 │
├─────────────────────────────────────────────┤
│                                             │
│  Step 1: Scan all imports                   │
│  ├─ Find entry points                       │
│  └─ Build dependency graph                  │
│                                             │
│  Step 2: Bundle                             │
│  ├─ Combine related modules                 │
│  ├─ Tree shake unused code                  │
│  └─ Code split by route                     │
│                                             │
│  Step 3: Optimize                           │
│  ├─ Minify JavaScript                       │
│  ├─ Optimize CSS                            │
│  └─ Compress images                         │
│                                             │
│  Step 4: Output                             │
│  └─ Write to .output/ or dist/              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Common Issues & Solutions

### Issue 1: "Cannot GET /" with `npm run serve` (SSR)

**Problem:**
```bash
npm run build
npm run serve
# Error: Cannot GET /
```

**Cause:** `vite preview` doesn't work for SSR apps

**Solution:**
```bash
# Add to package.json:
"start": "node .output/server/index.mjs"

# Then run:
npm run build
npm run start
```

---

### Issue 2: DevTools shows source files in production

**Problem:** Source files visible even after `npm run build`

**Cause:** Still running dev server (`npm run dev`)

**Solution:**
```bash
# Stop dev server (Ctrl+C)
npm run build
npm run start  # (SSR) or npm run serve (CSR)
```

---

### Issue 3: Changes not reflecting

**Development:**
```bash
# HMR should auto-update
# If not, restart dev server
npm run dev
```

**Production:**
```bash
# Must rebuild!
npm run build
npm run start
```

---

## Comparison Table

| Aspect | Dev Mode | Production Mode |
|--------|----------|----------------|
| **Command** | `npm run dev` | `npm run build` + `npm run start` |
| **Files Served** | Source files | Bundled files |
| **TypeScript** | Yes (transformed) | No (compiled to JS) |
| **Minification** | No | Yes |
| **Source Maps** | Yes (inline) | Optional |
| **HMR** | Yes | No |
| **File Size** | Larger | Smaller |
| **Speed** | Instant updates | Must rebuild |
| **Debugging** | Easy | Harder (minified) |
| **Port** | 3000 (configurable) | 3000 (SSR) or 4173 (CSR preview) |
| **Performance** | Slower (transforms on-the-fly) | Faster (pre-bundled) |

---

## Summary

**What you saw in DevTools during `npm run dev`:**
- ✅ **Normal behavior!** Source files are served in development
- ✅ Allows better debugging with readable code
- ✅ Enables Hot Module Replacement for instant updates
- ❌ Not representative of production

**To see production file structure:**
```bash
# For CSR (TanStack Router):
npm run build
npm run serve  # or vite preview

# For SSR (TanStack Start):
npm run build
npm run start  # or node .output/server/index.mjs
```

**Key Difference:**
- **CSR**: `vite preview` works (static files)
- **SSR**: Need `node .output/server/index.mjs` (requires server runtime)

The "weird" serving you saw is actually Vite's **development mode magic** - serving source files for better developer experience!
