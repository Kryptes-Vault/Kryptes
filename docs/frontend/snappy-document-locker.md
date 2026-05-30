# Snappy Document Locker & R2 Integration

## Overview

The Document Locker component (`src/components/kryptex/DocumentLocker.tsx`) handles secure, encrypted document storage using Cloudflare R2 bucket transactions. Recent updates focused on accelerating the user feedback cycle and resolving schema mapping discrepancies for newly uploaded items.

---

## Technical Features

### 1. High-Speed Upload UI
To make uploads feel lightning-fast, we refactored the simulated progress bar. It now runs on a faster **60ms interval** (down from 180ms) and uses larger, randomized increment steps:

```typescript
// Progress interval logic
const interval = setInterval(() => {
  setProgress((prev) => {
    if (prev >= 90) {
      clearInterval(interval);
      return 90;
    }
    const increment = Math.floor(Math.random() * 15) + 8; // Accelerated steps
    return Math.min(prev + increment, 90);
  });
}, 60);
```

Once the backend `/commit` endpoint responds with a `200 OK` status, the simulator jumps immediately to **100%**, clears the upload state, and refreshes the document gallery without delay.

### 2. R2 Cipher Key Schema Mapping Fallback
During document decryption, the viewer component parses the R2 storage key. Older records used a different database schema, which could cause files to disappear from the UI list. We added a safe fallback chain to ensure all files display correctly:

```typescript
// Fallback key resolving chain
const r2ObjectKey = 
  row.object_key || 
  row.objectKey || 
  row.ciphertext || 
  row.key;
```

This fallback chain maps the correct payload variables to the decryption engine so that newly uploaded files are immediately visible in the gallery list.

---

## 🛠️ Verification Checklist

1. **Upload Experience Test**:
   * Choose a file and click upload.
   * **Expected Result**: Progress bar quickly steps to 90%. As soon as the API call succeeds, the progress bar jumps to 100% and closes, rendering the new file in the gallery instantly.
2. **Backward Compatibility Test**:
   * Load mock data with legacy ciphertext schemas.
   * **Expected Result**: Legacy files map correctly through the fallback chain and render without throwing decryption failures.
