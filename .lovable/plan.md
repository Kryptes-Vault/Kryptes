

## Plan

This request has two parts:

### Part 1: Generate Desktop/Laptop Mockup Image
Use the AI image generation skill to create a high-fidelity MacBook Pro photo showing a desktop version of the password manager app. The desktop UI will feature a left sidebar (Vault, Finance, Email, Schedule), 3-pane email view, finance analytics graphs, and a drag-and-drop calendar — all matching the dark mode/glassmorphism aesthetic from the existing mobile mockup. The generated image will be saved to `src/assets/laptop-ui-mockup.jpg`.

### Part 2: Build Landing Page
Replace the placeholder `Index.tsx` with a full landing page for the password manager app. The page will use the existing smartphone mockup as the hero image and the newly generated laptop mockup in a later section.

**Landing page sections:**
1. **Hero** — Bold headline ("Keep Your Life Safe"), subtext, CTA buttons, smartphone mockup image prominently displayed
2. **Features grid** — Cards for Secure Vault, Finance Tracker, Unified Email, Smart Schedule with icons and descriptions
3. **Desktop showcase** — Laptop mockup image with copy about cross-platform experience
4. **Social proof** — Stats (users, credentials secured, uptime)
5. **CTA / Footer** — Final call-to-action and minimal footer

**Design:**
- Dark theme with warm orange/amber accent colors matching the mockup aesthetic
- Glassmorphism card effects (backdrop-blur, semi-transparent backgrounds)
- Smooth gradient backgrounds (dark navy to near-black)
- Clean typography, generous spacing
- Fully responsive

**Files to create/modify:**
- `src/pages/Index.tsx` — Full landing page with all sections
- `src/index.css` — Add dark theme custom properties and gradient utilities
- `src/assets/laptop-ui-mockup.jpg` — Generated via AI image skill

