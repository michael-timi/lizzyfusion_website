# Lizzy Fusion

**Modesty Redefined, Style Redesigned**

Official marketing and storefront-style site for **Lizzy Fusion** — modest fashion, bespoke and ready-to-wear, based in **Osogbo, Osun State, Nigeria**. The live experience is built with Next.js and presents collections, custom tailoring, training, and contact flows aligned with the studio’s vision.

## What’s in this repo

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4** for layout and styling
- Pages for **Home**, **Shop**, **Cart / Checkout**, **Custom / Bespoke**, **Training**, **Apprentices**, **About**, **Contact**, **Login / Register / Forgot password**, and policies
- Shared **brand, contact, and navigation** copy in `src/lib/site.ts`
- **Firebase Authentication** (email/password + Google) via `src/lib/firebase-auth.ts` and `src/lib/firebase.ts`
- **Checkout sign-in**: only `/checkout/info`, `/checkout/shipping`, and `/checkout/payment` require a signed-in user (see `src/app/checkout/(protected)/`). **Success / failure** pages do not, so a finished checkout still shows a confirmation if the session ends.
- **Firestore orders**: after “Pay on WhatsApp”, a **session snapshot** of the bag and shipping form (no card fields) is written to the `orders` collection when the user is still signed in—see `firestore.rules`, `src/lib/firebase-orders.ts`, and `src/lib/checkout-order-snapshot.ts`. Deploy rules with the Firebase CLI after enabling Firestore in the console.

## Environment variables

Copy `.env.example` to `.env.local` and add your Firebase **Web app** config (`NEXT_PUBLIC_FIREBASE_*`). In the Firebase console:

1. Enable **Authentication** → **Email/Password** and **Google** (and add authorized domains, e.g. `localhost` and production).
2. Create a **Firestore** database (production mode is fine once rules are deployed) and run `firebase deploy --only firestore:rules` from this repo (requires [Firebase CLI](https://firebase.google.com/docs/cli) logged into the **lizzy-fusion** project).

`FIREBASE_WEBAPP_CONFIG` is used automatically on **Firebase App Hosting** builds; local dev normally uses `NEXT_PUBLIC_*` only.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run start`| Serve production         |
| `npm run lint` | ESLint                   |
| `npm run test` | Vitest unit tests        |

## Project layout (high level)

- `src/app/` — routes and layouts (`page.tsx`, `layout.tsx`, `globals.css`)
- `src/components/` — header, footer, checkout, auth, shop UI
- `src/lib/` — site copy, cart, Firebase helpers, order snapshot
- `public/brand/` — logo and brand overview assets
- `firestore.rules` / `firebase.json` — Firestore security and CLI project wiring
- `AGENTS.md` / `CLAUDE.md` — notes for contributors and AI assistants

## Security notes

- **Card numbers** are not collected for real processing; checkout is WhatsApp-led. Snapshots and Firestore documents **strip** card fields before persistence.
- `npm audit` may still report **moderate** issues in nested `postcss` via `next` until upstream releases a fix; avoid `npm audit fix --force` here (it can pin an incompatible Next version).

## Deploying

This app is a standard Next.js project and can be deployed on [Vercel](https://vercel.com), [Firebase App Hosting](https://firebase.google.com/docs/app-hosting), or any host that supports Node.js. Mirror `.env.local` secrets in the host’s environment UI for production.

## Repository

Source: [github.com/michael-timi/lizzyfusion_website](https://github.com/michael-timi/lizzyfusion_website)

---

*Lizzy Fusion — empowering modest style with bespoke care, ready-to-wear convenience, and studio training in Osogbo.*
