# CryptoGuard Deployment Checklist

Quick checklist before deploying with CryptoGuard workflow.

## Pre-Deployment Checklist

### 1. GitHub Secrets ✓
- [ ] `DOMAIN` secret added (`nei.qingyun-kong.com`)
- [ ] `PRIVATE_KEY` secret added (64 hex characters)
- [ ] Secrets are accessible in repository Settings → Secrets → Actions

### 2. Dependencies ✓
- [ ] `@cmdoss/cryptoguard-manifest-nextjs` in devDependencies
- [ ] React version is 19.0.0 (not 19.1.0)
- [ ] pnpm is used as package manager

### 3. Next.js Configuration ✓
- [ ] `next.config.ts` has `withCryptoGuardManifest()` wrapper
- [ ] Build succeeds locally: `pnpm build`
- [ ] `manifest.json` is generated in root after build

### 4. Workflow File ✓
- [ ] `.github/workflows/cryptoguard-deploy.yml` exists
- [ ] Workflow uses `CommandOSSLabs/cryptoguard-action@v0.4.0`
- [ ] Build directory is set to `./.next`
- [ ] "Prepare Manifest" step copies manifest to build dir

### 5. Domain Registration
- [ ] Domain is registered on Sui blockchain
- [ ] Domain is registered with the same private key in secrets
- [ ] Registry ID matches workflow: `0x7d7d100cce0cbbd01625b7f250c14cf25080fdcc412c651054ce44fe13f79bea`

### 6. Network Configuration
- [ ] Network is set to `testnet` in workflow
- [ ] Package ID matches network: `0xddba6e2954145327888ca39d4875b858622023175869d63b06e2d2ff7cc49310`

## Deployment Steps

### Step 1: Test Build Locally
```bash
cd /path/to/nextjs-v15
pnpm install
pnpm build
ls manifest.json    # Should exist
cat manifest.json   # Should show framework: nextjs
```

### Step 2: Add GitHub Secrets
```
GitHub Repo → Settings → Secrets and variables → Actions
→ New repository secret

Secret 1:
  Name: DOMAIN
  Value: nei.qingyun-kong.com

Secret 2:
  Name: PRIVATE_KEY
  Value: <your-64-char-hex-key>
```

### Step 3: Commit and Push
```bash
git add .github/ WORKFLOW-SETUP.md
git commit -m "feat: add CryptoGuard deployment workflow"
git push origin main
```

### Step 4: Monitor Deployment
```
GitHub Repo → Actions tab
→ Watch "CryptoGuard Deploy with Manifest" workflow
→ Verify all steps succeed
```

### Step 5: Verify Deployment
Check workflow output for:
- [ ] ✓ Manifest validated: nextjs v15.5.4
- [ ] ✓ Uploaded 4 blobs (content, provenance, manifest, metadata)
- [ ] ✓ Domain updated successfully
- [ ] Manifest blob ID logged

## Quick Verification Commands

### Local Build Test
```bash
pnpm build && ls -la manifest.json .next/manifest.json
```

### Manifest Validation
```bash
cat manifest.json | jq .
# Should show:
# - version: "1.0"
# - framework: "nextjs"
# - frameworkVersion: "15.5.4"
# - sources: [2 items]
```

### GitHub Secrets Check
```bash
# No command - must check in GitHub UI
# Settings → Secrets → Actions → should show DOMAIN and PRIVATE_KEY
```

## Common Issues Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| React useRef error during build | Downgrade to React 19.0.0: `pnpm add react@19.0.0 react-dom@19.0.0` |
| Manifest not found | Check "Prepare Manifest" step in workflow |
| Invalid manifest format | Rebuild locally: `pnpm build` |
| Domain update fails | Verify PRIVATE_KEY secret is correct |
| Workflow permission error | Check workflow has `id-token: write` permission |

## Success Indicators

When everything works correctly, you'll see:

```
✓ Build (generates manifest.json)
✓ Prepare Manifest (copies to .next/)
✓ CryptoGuard Deploy
  ✓ Manifest validated: nextjs v15.5.4
  ✓ Sources: 2 directory mappings
  ✓ Uploaded 4 blobs
    Content: 0x...
    Provenance: 0x...
    Manifest: 0x... (nextjs)
    Metadata: 0x...
  ✓ Domain updated: nei.qingyun-kong.com
```

## Need Help?

- **Setup Guide**: `.github/SETUP.md`
- **Complete Documentation**: `WORKFLOW-SETUP.md`
- **GitHub Issues**: https://github.com/CommandOSSLabs/binary-transparency/issues

---

**Last Updated**: December 19, 2025
