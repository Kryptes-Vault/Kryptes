# Privacy Policy for Kryptex
**Effective Date:** April 6, 2026

Kryptex ("we," "us," or "our") is committed to protecting your privacy through a **Zero-Knowledge Architecture**. This Privacy Policy explains how we handle your information and, more importantly, what we cannot access.

---

### 1. Zero-Knowledge Architecture
Kryptex is designed so that only you can access your data.
- **Client-Side Encryption:** All data is encrypted on your device using the **AES-256** algorithm before it ever leaves your local environment.
- **No Access to Vaults:** We do not have access to your master password, recovery keys, encrypted files, or vault contents.
- **No Backdoors:** Because we do not hold the keys, we cannot decrypt your data, even if requested by law enforcement.

### 2. Information We Collect
We minimize data collection to the absolute necessity for account management:
- **Identity Verification:** We use OAuth 2.0 (Google, X, Microsoft, Yahoo) for authentication. We only receive your basic profile information (Email and Name) to create and identify your account.
- **Service Metadata:** We store minimal metadata required to sync your encrypted blobs across devices.

### 3. Data Processing & Storage
- **Financial Data (SMS):** SMS parsing for expense tracking is performed **locally** on your device. The resulting data is stored as encrypted blobs.
- **Documents & Files:** Personal documents (certificates, IDs) are stored as encrypted blobs.
- **Storage Providers:** Large files are stored via the **MEGA API**. These files are encrypted client-side before upload; neither Kryptex nor MEGA can read their contents.
- **Database:** Encrypted vault data and metadata are stored in our secure backend (MongoDB/Redis), but remain unreadable to us.

### 4. Third-Party Services
We use the following third-party integrations:
- **OAuth Providers:** Google, X (Twitter), Microsoft, Yahoo.
- **Storage:** MEGA.nz (for encrypted file hosting).
- **Communication:** Email services for account-related notifications.

### 5. Your Responsibilities
**The Master Password and Recovery Key are your sole responsibility.** 
- If you lose your Master Password, your data is **permanently unrecoverable**.
- Kryptex cannot reset your password or recover your data because we never possess your keys.

### 6. Jurisdiction
This Privacy Policy and your use of Kryptex are governed by the laws of **Hyderabad, India**. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad.

### 7. Contact Us
If you have questions about this Privacy Policy, contact us at: [support@kryptes.com](mailto:support@kryptes.com)
