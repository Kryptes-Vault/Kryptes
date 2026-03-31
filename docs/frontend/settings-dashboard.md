# 49. Settings Dashboard & Navigation Overhaul

## Overview
The "Settings" dashboard is a centralized control hub for the Kryptes vault. It implements a two-column, cyber-minimalist layout for managing cryptographic identity, security protocols, UI preferences, and data portability.

## Technical Specifications

### 1. Unified Navigation
- **Relocation**: In compliance with high-security UX patterns, the "Sign Out" function has been removed from the global mini-sidebar and relocated exclusively to the **Settings Dashboard**.
- **Visual Style**: Glassmorphic sidebar with `#FF3300` (Kryptes Red) accent for active states.

### 2. Functional Modules

#### A. Account & Identity
- **Profile**: Displays authenticated node ID (Email) and avatar.
- **Master Password Revision**: 
  - Fields for `Current Key`, `New Identity Key`, and `Confirm Key`.
  - **Zero-Knowledge Warning**: Prominent alert regarding the non-recoverable nature of the master password.
- **Danger Zone**: 
  - Permanently purges all encrypted nodes.
  - Verification: Requires explicit "DELETE" string input to prevent accidental data loss.

#### B. Security & Access
- **Auto-Lock**: Configurable inactivity duration (1m, 5m, 15m, Never).
- **WebAuthn Integration**: Toggle for Biometric Unlock (FaceID / Windows Hello).
- **2FA**: Trigger for setting up Authenticator-based Time-based One-Time Passwords (TOTP).

#### C. Vault Preferences
- **Theme Engine**: Support for `Dark`, `Light`, and `System` modes.
- **Display Mode**: Toggle between `Grid View` (default) and `List View`.
- **Clipboard Sanitation**: Automatically flushes any copied sensitive data from the system clipboard after a 30-second delay.

#### D. Data Management
- **Encrypted Portability**: Export entire vault as a structured JSON file.
- **Bulk Ingestion**: Drag-and-drop support for CSV/JSON imports from services like 1Password or Bitwarden.

## Design System
- **Fonts**: 
  - Sans-Serif: UI Labels & Categories.
  - Monospace (JetBrains Mono): Sensitive data points and terminal inputs.
- **Color Palette**:
  - Primary: `#FF3300` (Red/Orange)
  - Background (Dark): `#0a0a0a`
  - Background (Light): `#ffffff`
  - Accents: Low-opacity whites/blacks for glassmorphic borders.

## Components
- **Primary Component**: `src/components/kryptex/SettingsView.tsx`
- **Dependencies**: `lucide-react`, `framer-motion`, `tailwind-css`
