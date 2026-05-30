# Protocol 55 — Active Session Gateway Specification

> **Status**: ACTIVE  
> **Author**: Kryptex Engineering  
> **Created**: 2026-05-30  
> **Affects**: `src/App.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/kryptex/auth/Login.tsx`

---

## Problem Statement

Historically, the entry point for the Kryptex Vault suffered from two UX constraints:
1. **Redirection Loop for Guest Users**: The "Access Vault" hero button linked directly to `/dashboard`. When unauthenticated, the `ProtectedRoute` guard intercepted the navigation and redirected the user to `"/"`, creating a loop that prevented access to the login/signup interface.
2. **Auto-Redirection for Authenticated Users**: Users with an active session who visited `/auth` were automatically redirected to `/dashboard`. While efficient, this made it impossible for users to choose a different account or sign out from the authentication view without loading the entire vault first.

---

## Solution: Unified `/auth` Gateway and Active Session UX

### Architecture

```
                       ┌─────────────────────────┐
                       │  User Clicks "Access"   │
                       └────────────┬────────────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │   Route: /auth     │
                         └──────────┬─────────┘
                                    │
                                    ├──────────────────────┐
                                    ▼ [No Active Session]  ▼ [Active Session]
                           ┌─────────────────┐    ┌──────────────────┐
                           │   Login Modal   │    │  Active Session  │
                           │   (Sign In)     │    │   Prompt Card    │
                           └─────────────────┘    └────────┬─────────┘
                                                           │
                                   ┌───────────────────────┴───────────────────────┐
                                   ▼                                               ▼
                        ┌─────────────────────┐                         ┌─────────────────────┐
                        │ CONTINUE TO VAULT   │                         │ USE DIFFERENT ACC   │
                        │ (Route: /dashboard) │                         │ (Supabase Sign Out) │
                        └─────────────────────┘                         └─────────────────────┘
```

### Technical Implementation

#### 1. Routing Gateway (`App.tsx`)
Rather than linking directly to `/dashboard`, the "Access Vault" buttons on the landing page now point to the unified `/auth` route:

```tsx
// src/components/landing/HeroSection.tsx
<a 
  href="/auth" 
  className="px-8 py-3.5 bg-orange-500 ..."
>
  Access Vault
</a>
```

#### 2. AuthRoute Gatekeeper (`App.tsx`)
The `AuthRoute` component evaluates the current session state using the `useAuth()` context hook. When a session is active, a custom session prompt state is updated rather than executing an immediate redirection:

```tsx
const AuthRoute = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      setShowSessionPrompt(true);
    }
  }, [isLoading, user]);
  
  // ...
};
```

---

## Active Session Prompt Interface

The prompt interface utilizes a premium, card-based layout matching the Kryptes dark-mode/glassmorphic theme.

### UI Specs & Tailwind Tokens

```
┌────────────────────────────────────────────────────────┐
│  ACTIVE SESSION                                        │
│  YOU ARE CURRENTLY LOGGED IN                           │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ( C )  LOGGED IN AS                              │  │
│  │        chitkullakshya@gmail.com                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CONTINUE TO VAULT                             →  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ USE A DIFFERENT ACCOUNT                          │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

1. **Card Container**
   - Rounded corners (`rounded-[2rem] sm:rounded-[2.5rem]`) and custom large shadow elevations (`shadow-[0_40px_100px_rgba(0,0,0,0.2)]`) provide depth.
   - Spacing (`p-8 sm:p-12`) is carefully balanced to eliminate clipping.

2. **High-Contrast Identity Card**
   - A soft grey container (`bg-[#f8f8f8] border border-black/5`) isolates the logged-in email.
   - **Initials Avatar**: A circular initials badge (`w-12 h-12 rounded-full bg-[#FF3B13]/10`) styled with a rich orange border outline (`border border-[#FF3B13]/20`) and high-weight character formatting (`font-black text-lg`).
   - **Label Visibility**: Subtitles styled in standard bold brand-orange (`text-[10px] font-bold text-[#FF3B13]`) for high readability.
   - **Email Visibility**: Upgraded email address typography from tiny fallback `text-xs` (12px) to a highly visible `text-sm sm:text-base font-black text-black truncate` to guarantee clarity.

3. **Action Buttons**
   - **Primary Action (Continue to Vault)**:
     - Formatted as a high-density brand-orange capsule (`bg-[#FF3B13] text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl`).
     - Includes a massive custom shadow offset (`shadow-[0_15px_30px_rgba(255,59,19,0.3)]`) and transition shifts to improve click feedback.
   - **Secondary Action (Use a Different Account)**:
     - Formatted as a transparent outline capsule (`bg-transparent border border-black/10 text-black py-4 sm:py-5 rounded-xl sm:rounded-2xl`).
     - Increasing the vertical spacing (`space-y-4`) and applying valid padding prevents any vertical shadow overlaps.

---

## Session Termination Flow

When the user selects **"Use a Different Account"**, the gateway executes the following lifecycle sequence:

1. **State Trigger**: Set `signingOut` state to `true` to enable transition locks.
2. **Supabase Invalidation**: Invoke the Supabase auth client to terminate the session:
   ```javascript
   await supabase.auth.signOut();
   ```
3. **Gateway Refresh**: `showSessionPrompt` is set to `false`, causing the card to unmount and dynamically displaying the standard `<Login>` component for fresh credentials input.
4. **Transition Loader**: Injects a loading spinner state (`<Loader2 className="animate-spin" />`) during transit to prevent flickering.
