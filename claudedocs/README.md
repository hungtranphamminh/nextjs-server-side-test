# Next.js Build Manifest Documentation

Documentation for understanding Next.js build output, manifest files, and deployment artifacts.

## Documents in This Folder

### 1. [dev-vs-production-serving.md](./dev-vs-production-serving.md)
**Why DevTools shows source files in development**

Topics covered:
- Development vs production mode explained
- Why you see TypeScript source files in DevTools during `npm run dev`
- How Vite serves files (on-the-fly transformation)
- Why `npm run serve` doesn't work for SSR apps
- Visual comparison of dev vs production file serving
- DevTools network/sources tab breakdown
- Common issues and solutions
- CSR vs SSR production serving differences

**Use when:** You're confused why DevTools shows source files instead of built files, or `npm run serve` gives "Cannot GET /"

---

### 2. [tanstack-csr-vs-ssr-comparison.md](./tanstack-csr-vs-ssr-comparison.md)
**Deep dive: TanStack Router CSR vs TanStack Start SSR**

Topics covered:
- What changes when you add SSR to TanStack Router
- Build output transformation (456KB → 4.5MB)
- File mapping differences (static vs server-rendered)
- Rendering flow comparison (CSR vs SSR)
- Data fetching patterns (client vs server)
- Deployment complexity changes
- Browser download analysis
- Performance metrics (2-3s → 0.5s initial load)
- When to use which approach

**Use when:** You need to understand what SSR actually adds to a client-side React app, or deciding between CSR and SSR for TanStack.

---

### 3. [tanstack-vs-nextjs-comparison.md](./tanstack-vs-nextjs-comparison.md)
**Complete architecture comparison: SPA vs SSR across frameworks**

Topics covered:
- TanStack Router (SPA) vs Next.js (SSR/SSG) architecture
- Build output analysis (456KB vs 30MB)
- Rendering strategies (CSR vs SSR)
- Routing mechanisms (client-only vs hybrid)
- Data fetching patterns
- Deployment comparison (static vs server)
- Sigstore signing strategies for both
- Performance metrics and cost analysis
- Use case recommendations

**Use when:** You need to understand the fundamental differences between SPA and SSR architectures, or choosing between frameworks.

---

### 4. [nextjs-manifest-summary.md](./nextjs-manifest-summary.md)
**Comprehensive overview of Next.js build structure**

Topics covered:
- Build output structure (`.next/`, `public/`, artifacts)
- Manifest files reference and their purposes
- URL mapping and serving strategy
- Page load breakdown (what browser actually downloads)
- Configuration deep dive
- Artifact creation for deployment
- Sigstore signing recommendations

**Use when:** You need to understand the complete build structure and what each file does.

---

### 5. [manifest-configuration-guide.md](./manifest-configuration-guide.md)
**In-depth guide to configuring and customizing manifest behavior**

Topics covered:
- Manifest files relationship map (visual)
- Configuration files that control manifests
- Default mapping rules
- Customization examples (CDN, subdirectory, API proxy)
- Manifest reading process (build → deploy → request)
- Debugging manifests
- Common issues and solutions
- Best practices

**Use when:** You need to customize Next.js behavior or troubleshoot manifest-related issues.

---

## Quick Reference

### Build Output Structure
```
nextjs/
├── .next/                  (30MB - build output)
│   ├── static/            (11MB - client-side JS)
│   ├── server/            (18MB - server-only code)
│   └── *.json             (manifest files)
├── public/                 (20KB - static assets)
├── package.json
└── next.config.js
```

### Key Manifest Files

| File | Purpose | Reader |
|------|---------|--------|
| `build-manifest.json` | Page → chunks mapping | Browser |
| `required-server-files.json` | Runtime configuration | Server/Platform |
| `routes-manifest.json` | Routing rules | Server |
| `app-build-manifest.json` | App Router mappings | Browser |
| `prerender-manifest.json` | SSG/ISR config | Server |

### URL Mapping Quick Reference

```
Browser Request              →  File Location
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/                            →  .next/server/app/page.js (SSR)
/_next/static/chunks/*.js    →  .next/static/chunks/*.js
/logo.svg                    →  public/logo.svg
/api/hello                   →  .next/server/app/api/hello/route.js
```

### Deployment Artifact Contents

**Minimum required:**
```bash
.next/                     # All build output
public/                    # Static assets
package.json              # Dependencies
pnpm-lock.yaml           # Lock file
next.config.js           # Configuration (optional, baked into manifests)
```

**Create artifact:**
```bash
tar -czf nextjs-artifact.tar.gz .next/ public/ package.json pnpm-lock.yaml
```

---

## Common Commands

### View Configuration
```bash
# Current runtime config
cat .next/required-server-files.json | jq '.config | {distDir, assetPrefix, basePath}'

# Routing rules
cat .next/routes-manifest.json | jq '.redirects, .rewrites'

# Page chunks
cat .next/app-build-manifest.json | jq '.pages'
```

### Analyze Build
```bash
# Size breakdown
du -sh .next/static/ .next/server/ public/

# Count chunks
ls -1 .next/static/chunks/*.js | wc -l

# List all manifests
ls -lh .next/*.json
```

### Verify Manifest Integrity
```bash
# Check all manifests are valid JSON
for f in .next/*.json; do
  jq empty "$f" && echo "✅ $f" || echo "❌ $f"
done
```

---

## Configuration Snippets

### CDN Integration
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  assetPrefix: 'https://cdn.example.com',
};
```

### Subdirectory Deployment
```typescript
const nextConfig: NextConfig = {
  basePath: '/app',
};
```

### Custom Redirects
```typescript
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/old', destination: '/new', permanent: true }
    ];
  }
};
```

---

## Sigstore Signing Options

### Option 1: Sign Complete Artifact
```bash
tar -czf artifact.tar.gz .next/ public/ package.json pnpm-lock.yaml
cosign sign-blob --bundle artifact.bundle artifact.tar.gz
```

### Option 2: Sign Client Code Only
```bash
tar -czf client.tar.gz .next/static/ public/
cosign sign-blob --bundle client.bundle client.tar.gz
```

### Option 3: Sign Manifests Only
```bash
cosign sign-blob --bundle manifest.bundle .next/required-server-files.json
```

---

## Troubleshooting

### Issue: Static assets return 404
**Check:** `basePath` configuration
```bash
cat .next/required-server-files.json | jq '.config.basePath'
```
If basePath is `/app`, assets are at `/app/logo.svg`, not `/logo.svg`

### Issue: Wrong chunk URLs
**Check:** `assetPrefix` configuration
```bash
cat .next/build-manifest.json | jq '.pages["/"][0]'
```
Ensure assetPrefix matches your CDN or is empty for same-origin

### Issue: Redirects not working
**Rebuild and verify:**
```bash
pnpm build
cat .next/routes-manifest.json | jq '.redirects'
```

---

## Additional Resources

- [Next.js Official Docs](https://nextjs.org/docs)
- [Deployment Documentation](https://nextjs.org/docs/deployment)
- [Output File Tracing](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Sigstore Documentation](https://docs.sigstore.dev/)

---

## Questions Answered

**Q: What exactly is in the build artifact?**
A: See `nextjs-manifest-summary.md` → "Artifact Creation for Deployment"

**Q: How do I customize URL paths?**
A: See `manifest-configuration-guide.md` → "Customizing Manifest Behavior"

**Q: What gets sent to the browser vs. stays on server?**
A: See `nextjs-manifest-summary.md` → "Build Output Structure"

**Q: How do I sign the build for deployment?**
A: See both documents' Sigstore sections for different signing strategies

**Q: How do manifests work together?**
A: See `manifest-configuration-guide.md` → "Manifest Files Relationship Map"

---

## Build & Deploy Checklist

- [ ] Run `pnpm build`
- [ ] Verify manifests exist: `ls .next/*.json`
- [ ] Check build size: `du -sh .next/`
- [ ] Create artifact: `tar -czf artifact.tar.gz .next/ public/ package.json pnpm-lock.yaml`
- [ ] Sign artifact (optional): `cosign sign-blob artifact.tar.gz`
- [ ] Verify signature: `cosign verify-blob artifact.tar.gz`
- [ ] Deploy to platform
- [ ] Test in browser: Check Network tab for chunk loading

---

**Generated:** 2025-10-13
**Next.js Version:** 15.5.4
**Build Tool:** Turbopack
