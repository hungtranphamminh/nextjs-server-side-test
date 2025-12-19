# CryptoGuard Blob Structure - Corrected Design

## Overview

The CryptoGuard deployment system uses a **2-blob structure** for efficient storage and verification on Walrus.

## Correct Design (v0.4.1+)

```
┌─────────────────────────────────────┐
│   Blob 1: Content Quilt             │
│   ─────────────────────────          │
│   All application files              │
│   - index.html                       │
│   - style.css                        │
│   - app.js                           │
│   - assets/*                         │
│   ...                                │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│   Blob 2: Metadata Quilt            │
│   ─────────────────────────          │
│   Contains 2 embedded files:         │
│   1. provenance.json (SLSA)          │
│   2. manifest.json (routing)         │
│   ─────────────────────────          │
│   Links to Blob 1                    │
└─────────────────────────────────────┘
```

### Total: **2 Blobs** (not 4!)

---

## Blob 1: Content Quilt

**Purpose**: Container for all application files

**Structure**:
```json
{
  "version": "1.0",
  "files": [
    {
      "path": ".next/static/chunks/main.js",
      "blobId": "0xabc123...",
      "size": 45678,
      "contentType": "application/javascript"
    },
    {
      "path": "public/logo.png",
      "blobId": "0xdef456...",
      "size": 12345,
      "contentType": "image/png"
    }
    // ... all other application files
  ],
  "metadata": {
    "created_at": "2025-12-19T12:00:00.000Z",
    "total_files": 25,
    "total_size": 342500
  }
}
```

**Each file** in the content quilt is uploaded as a separate blob, then the manifest listing them is uploaded as the "Content Quilt" blob.

---

## Blob 2: Metadata Quilt

**Purpose**: Container for provenance and manifest with embedded content

**Structure**:
```json
{
  "version": "1.0",
  "files": [
    {
      "path": "provenance.json",
      "blobId": "",  // Empty - content embedded below
      "size": 1500,
      "contentType": "application/json"
    },
    {
      "path": "manifest.json",
      "blobId": "",  // Empty - content embedded below
      "size": 250,
      "contentType": "application/json"
    }
  ],
  "metadata": {
    "created_at": "2025-12-19T12:00:00.000Z",
    "content_quilt_id": "0x...",  // Links to Blob 1
    "framework": "nextjs",
    "framework_version": "15.5.4",
    "deployment_type": "two-quilt-structure",

    // Embedded content (NOT separate blobs)
    "provenance": {
      "_type": "https://in-toto.io/Statement/v1",
      "subject": [...],
      "predicateType": "https://slsa.dev/provenance/v1",
      "predicate": {
        "buildDefinition": {...},
        "runDetails": {...}
      }
    },
    "manifest": {
      "version": "1.0",
      "framework": "nextjs",
      "frameworkVersion": "15.5.4",
      "sources": [
        {"dir": ".next/static", "serveAt": "/_next/static"},
        {"dir": "public", "serveAt": "/"}
      ]
    }
  }
}
```

**Key Points**:
- Provenance and manifest are **embedded in metadata.provenance and metadata.manifest**
- They are NOT uploaded as separate blobs
- `blobId` fields for provenance.json and manifest.json are empty strings
- The entire metadata quilt JSON is uploaded as a single blob

---

## Why This Design?

### Benefits

1. **Efficiency**: Only 2 quilt blobs instead of 4
2. **Simplicity**: Fewer blob IDs to track
3. **Atomic Updates**: Provenance + manifest always stay together
4. **Lower Cost**: Fewer Walrus storage operations

### Before (Wrong - 4 blobs)
```
App Files → Blob 1: Content Quilt
           Blob 2: Provenance (separate)
           Blob 3: Manifest (separate)
           Blob 4: Metadata Quilt → links to 1,2,3
```
**Problem**: Unnecessary separation, more complex, 4 separate uploads

### After (Correct - 2 blobs)
```
App Files → Blob 1: Content Quilt
           Blob 2: Metadata Quilt (contains provenance + manifest)
```
**Solution**: Embedded content, simpler structure, 2 uploads

---

## Blockchain Storage

On the Sui blockchain, the domain record stores:

```move
struct SiteRecord {
    domain: String,
    owner: address,
    content_quilt_id: String,        // Blob 1 ID
    metadata_quilt_id: String,       // Blob 2 ID
    provenance_blob_id: String,      // Also Blob 2 ID (for compatibility)
    version: u64,
    last_updated: u64
}
```

**Note**: `provenance_blob_id` points to the **metadata quilt** (Blob 2) since that's where provenance is now embedded.

---

## Verification Flow

### 1. Browser Extension Fetches Domain
```typescript
const domain = "nei.qingyun-kong.com";
const siteRecord = await suiClient.getDomainRecord(domain);
```

### 2. Fetch Metadata Quilt
```typescript
const metadataQuilt = await walrus.fetchBlob(siteRecord.metadata_quilt_id);
const provenance = metadataQuilt.metadata.provenance;
const manifest = metadataQuilt.metadata.manifest;
```

### 3. Fetch Content Quilt
```typescript
const contentQuilt = await walrus.fetchBlob(metadataQuilt.metadata.content_quilt_id);
```

### 4. Verify Each File
```typescript
for (const file of contentQuilt.files) {
    const actualHash = await computeSha256(await fetch(file.path));
    const expectedHash = provenance.subject.find(s => s.name === file.path).digest.sha256;
    assert(actualHash === expectedHash);
}
```

---

## Workflow Output

When the GitHub Action runs successfully, you'll see:

```
✓ Step 4.5: Detect and Validate Manifest
  Found manifest.json, validating...
✓ Manifest validated: nextjs v15.5.4
  Sources: 2 directory mappings

✓ Step 5: Upload to Walrus (User Controlled)
✓ Uploaded 2 quilts with 25 application files (342.5 KB)
  Content Quilt: 0xabc123def...
  Metadata Quilt: 0xdef456ghi... (provenance + manifest)
  Framework: nextjs v15.5.4

✓ Step 6: Update Blockchain (User Signed - Trustless)
✓ Blockchain updated (you signed it!)
  Version: 5 → 6
  Gas: 0.0042 SUI
```

**Key indicator**: "Uploaded 2 quilts" (not 4 blobs)

---

## Migration from v0.4.0 to v0.4.1

### What Changed

**v0.4.0** (Wrong):
- 4 separate blobs
- Provenance uploaded separately
- Manifest uploaded separately
- Metadata quilt linked to 3 separate blobs

**v0.4.1** (Correct):
- 2 blobs total
- Provenance embedded in metadata quilt
- Manifest embedded in metadata quilt
- Metadata quilt is self-contained

### Update Your Workflow

Change version in `.github/workflows/cryptoguard-deploy.yml`:

```yaml
- name: CryptoGuard Deploy
  uses: CommandOSSLabs/cryptoguard-action@v0.4.1  # Changed from v0.4.0
```

No other changes needed - the action handles the new structure automatically.

---

## Summary

✅ **2 Blobs Total**
1. Content Quilt (all app files)
2. Metadata Quilt (embedded provenance + manifest)

✅ **Embedded Content**
- Provenance is NOT a separate blob
- Manifest is NOT a separate blob
- Both are embedded in metadata quilt JSON

✅ **Simpler & Efficient**
- Fewer uploads to Walrus
- Lower storage costs
- Atomic provenance + manifest updates

---

**Last Updated**: December 19, 2025
**Action Version**: v0.4.1
**Status**: Corrected design implemented
