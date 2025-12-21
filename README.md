<div align="center">

# 🛡️ Kryptes: Zero-Knowledge Super App & Vault

*Your ultimate privacy-first decentralized vault for passwords, banking cards, and secure files.*

### 🛠 Tech Stack

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Storj](https://img.shields.io/badge/Storj-0052FF?style=for-the-badge&logo=storj&logoColor=white)
![Bitwarden](https://img.shields.io/badge/Bitwarden-175DDC?style=for-the-badge&logo=bitwarden&logoColor=white)
![AES-256-GCM](https://img.shields.io/badge/AES--256--GCM-000000?style=for-the-badge&logo=letsencrypt&logoColor=white)

</div>

---

## 📖 Overview

Kryptes is a zero-knowledge super computing application designed from the ground up to protect your most sensitive personal information. From passwords and identity records to banking cards and heavy file blobs, Kryptes ensures complete privacy through rigorous end-to-end client-side encryption. The backend infrastructure only handles ciphertexts, meaning the core team, server providers, and cloud hosts can never view your plaintext data.

## ✨ Key Features

- **Zero-Knowledge Architecture:** Strict adherence to client-side encryption rules. The server only sees encrypted blobs to manage and store.
- **Gatekeeper Database Flag:** Highly optimized data retrieval utilizing Supabase. A `has_vault_data` flag prevents unnecessary network calls to Redis and Bitwarden for new users.
- **Decentralized File Storage:** Native integration with Storj network to store heavy encrypted file blobs with redundancy out of the box.
- **Encrypted Redis Caching:** Built-in Cache-Aside pattern utilizing AES-256-GCM to securely cache items like passwords and banking details without exposing plaintext to RAM.
- **Automated Backend Vault:** Native bridges into Bitwarden as the backend robust secrets manager.

## 🏗️ Security Architecture & Data Flow

Kryptes leverages a robust and segmented data path.

```mermaid
sequenceDiagram
    participant C as Client (React)
    participant E as Crypto Engine
    participant S as Supabase (PostgreSQL)
    participant N as Node.js (Express)
    participant R as Redis Cache
    participant BW as Bitwarden SDK
    participant ST as Storj Network
    
    C->>E: User Inputs Plaintext Data
    E-->>C: Returns Encrypted Ciphertext
    C->>N: Send Ciphertext (POST)
    N->>S: Check 'has_vault_data' Flag
    S-->>N: Flag updated (if needed)

    alt Data is File Blob
        N->>ST: Upload Encrypted Blob
        ST-->>N: Returns Access Key
    else Data is Vault Item (Card/Password)
        N->>BW: Save to Vault via SDK
        BW-->>N: Returns Success
        N->>R: Invalidate Redis Cache
    end
    
    N-->>C: Action Completed
```

### Advanced Gatekeeper Fetch Optimization

When pulling vault data:
1. **Gatekeeper Check:** Express requests `has_vault_data` flag from Supabase PostgreSQL.
2. If `FALSE`, exit early and return zero items (skipping all connections to Redis/Bitwarden).
3. If `TRUE`, attempts to read from Redis.
4. On Cache Miss, fetch from Bitwarden, write strictly encrypted objects back to Redis, and deliver data securely.

## 🚀 Installation

Ensure you have **Node.js (v18+)** and **Redis** running locally.

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Kryptes-Vault/Kryptes.git
   cd Kryptes
   ```

2. **Install Dependencies:**
   ```bash
   # Install frontend components
   npm install
   # Install backend services
   cd backend && npm install
   ```

3. **Configure the Environment:**
   Create `.env` variables for both client and backend (Redis, Supabase keys, encryption seed). See `env_template.md` for schemas.

4. **Start Development Servers:**
   ```bash
   # Start the Express Vault API
   npm run dev:backend
   
   # Start React frontend
   npm run dev
   ```

## 💻 Usage

- **Signing Up:** Users create a global identity on Supabase.
- **The Dashboard:** Navigate to the Vault Section to insert passwords and secrets.
- **Banking Profile:** A specialized container to store encrypted cards.
- **File Locker:** Drag & drop documents that get sliced, padded, encrypted, and relayed to Storj.

## 🗺️ Roadmap

- [x] Initial Express/Node backend bridging & API layout.
- [x] Integrate AES-GCM layer for cryptographic encapsulation.
- [x] Bitwarden integration to handle primary storage.
- [x] Database gatekeeper optimization.
- [ ] Implement fully localized Passkeys / WebAuthn.
- [ ] Complete native mobile (React Native) buildouts.

## 👥 Team

- **Lakshya Chitkul** - Project Lead & Architect
- **Prem Sai Kota** - Collaborator & Developer
- **Eeshitha Gone** - Collaborator & Developer

---
<div align="center">
  <sub>Built with ❤️ and security by the Kryptes Team.</sub>
</div>
