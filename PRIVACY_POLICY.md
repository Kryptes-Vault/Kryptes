# Privacy Policy for Kryptex
**Effective Date:** April 6, 2026

## 🚀 TL;DR (Too Long; Didn't Read)
*   **Zero-Knowledge:** We use client-side AES-256 encryption. We cannot see your files, messages, or passwords.
*   **On-Device Processing:** Financial SMS parsing happens locally on your phone. No raw transaction data is uploaded.
*   **Login Only:** We use OAuth 2.0 (Google, X, MS, Yahoo) only to verify who you are. We don't read your emails or tweets.
*   **Data Security:** Your data is stored as "encrypted blobs" via MEGA. Even they can't read it.
*   **Your Responsibility:** If you lose your Master Password, your data is gone forever. We have no "Reset Password" for your vault.
*   **No Selling:** We do not sell your data or use it to train AI.

---

## 1. Introduction
Kryptex ("the App," "we," "us") is built on the principle of **Privacy by Design**. Unlike traditional clouds, Kryptex is a **Zero-Knowledge Super App**. This means we have architected the system so that we have technical inability to access your unencrypted data. Our policy complies with GDPR, CCPA, and the Indian Information Technology Act.

## 2. The Zero-Knowledge Architecture
All sensitive data—including digital vault contents, finance trackers, and smart assistant notes—is encrypted on your device using **AES-256** before being transmitted.
*   **No Access:** Kryptex developers and servers have zero access to your unencrypted data.
*   **The Master Key:** Your Master Password is the sole key to your data. We do not store this password on our servers.

## 3. Data Collection and Usage
### 3.1 Authentication (OAuth 2.0)
We use OAuth 2.0 via Google, Microsoft, X (Twitter), and Yahoo for identity verification.
*   **Metadata Collected:** Only basic identity metadata (Email, Name, Unique Provider ID).
*   **Purpose:** To create your account and manage your subscription. We do not access your contacts, emails, or private messages from these providers.

### 3.2 Financial Privacy (On-Device Parsing)
Kryptex includes a Finance Engine that tracks expenses via SMS.
*   **Local Processing:** All SMS parsing occurs **strictly on-device**.
*   **No Raw Uploads:** Raw SMS text or raw transaction data is never uploaded to our servers. Only the resulting encrypted expense summaries are stored in your vault.

### 3.3 Large File Storage (MEGA API)
Encrypted file "blobs" are stored using the MEGA API. These files remain encrypted with your keys during transit and at rest. Neither Kryptex nor MEGA can decrypt these files.

## 4. No Data Monetization & AI
We maintain a strict stance against data exploitation:
*   **No Selling:** We do not sell, rent, or trade your personal data to third parties.
*   **No AI Training:** Your data is never used to train machine learning models or Artificial Intelligence.

## 5. Security & Technical Data
*   **Redis Caching:** We use Redis for temporary, encrypted session caching to improve performance. These sessions are short-lived and discarded.
*   **Bitwarden-Compatible Metadata:** Vault metadata follows a Bitwarden-compatible architecture to ensure industry-standard security and interoperability.

## 6. Jurisdiction
This policy is governed by the laws of **Hyderabad, India**.

## 7. Contact
For privacy-related inquiries: [privacy@kryptes.com](mailto:privacy@kryptes.com)
