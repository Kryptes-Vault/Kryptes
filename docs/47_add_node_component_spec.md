# Kryptes: "Add Node" Component Technical Specification

This document outlines the architecture, design decisions, and implementation details of the **Add Node** (Credential Creation) feature in the Kryptes dashboard.

## 1. Overview
The "Add Node" component is a highly dynamic, category-aware modal designed to handle various types of secrets including Web Credentials, Developer Environment Variables, Financial/Crypto details, and Secure Notes.

## 2. Component Architecture
The feature is split into two primary components:
- **`AddNodeModal.tsx`**: The main container, handling category navigation, form state, and entry-to-end encryption simulation.
- **`AppAutocomplete.tsx`**: A specialized sub-component for real-time brand discovery and metadata enrichment.

## 3. Key Features

### 3.1 Real-Time Brand Autocomplete
Integrated with the **Clearbit Autocomplete API**, the "Website URL" field provides:
- **Debounced Fetching**: 300ms delay to optimize API usage.
- **Logo Resolution**: Automatic display of company logos for recognized apps.
- **Metadata Inheritance**: Selecting a company automatically populates the "Title" and "Website" fields.

### 3.2 Dynamic Form Logic
The form layout adapts instantly based on the selected category:
- **Web**: Username, Password, and URL inputs.
- **Dev**: Environment selectors (Prod/Staging/Dev) and Key-Value paired textareas.
- **Financial**: Wallet name, Blockchain network selector, and indexed 12-word Seed Phrase grid.
- **Notes**: Full-width markdown-friendly textarea for sensitive payloads.

### 3.3 Cryptographic Identity (Aesthetic)
- **Glassmorphism**: 40% white backdrop blur with `#fafafa` interior panels.
- **Kryptes Red (#FF3B13)**: Used for high-contrast focus rings, primary actions, and brand identity.
- **Animations**: Orchestrated via `framer-motion` for category transitions and modal entry.

## 4. Technical Stack
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Motion**: Framer Motion
- **API**: Clearbit Suggest V1

## 5. Security Context
While the UI provides the capture mechanism, all data is intended for local encryption using `AES-GCM` before being synchronized with the Supabase vault. The "Seal & Store" action triggers the derive-and-encrypt workflow.

---
*Created on 2026-04-09 | Kryptes Engineering Docs*
