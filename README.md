# Lizzy Fusion

**Modesty Redefined, Style Redesigned**

Official marketing and storefront-style site for **Lizzy Fusion** — modest fashion, bespoke and ready-to-wear, based in **Osogbo, Osun State, Nigeria**. The live experience is built with Next.js and presents collections, custom tailoring, training, and contact flows aligned with the studio’s vision.

## What’s in this repo

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4** for layout and styling
- Pages for **Home**, **Shop**, **Cart / Checkout**, **Custom / Bespoke**, **Training**, **Apprentices**, **About**, **Contact**, **Login / Register / Forgot password**, and policies
- Shared **brand, contact, and navigation** copy in `src/lib/site.ts`
- **Firebase Authentication** (email/password + Google) via `src/lib/firebase-auth.ts` and `src/lib/firebase.ts`
- **Firestore** (`src/lib/firebase-db.ts`): checkout order snapshots → `orders` collection (`src/lib/firebase-orders.ts`); signed-in users get a `users/{uid}` profile from `src/lib/firebase-user-profile.ts` with `userType` (`user` by default — promote to `admin` in the console or via Admin SDK only)
- **Firebase Storage** (`src/lib/firebase-storage.ts`): rules in `storage.rules` — per-user paths `users/{uid}/**` for signed-in clients
- **Firebase Analytics / GA4** (`src/lib/firebase-analytics.ts`, `src/lib/analytics-events.ts`): loads when `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is set; tracks page views, e‑commerce (cart, checkout, purchase), auth, wishlist, search/filters, WhatsApp/mailto outbound clicks, lead forms, contact, blog engagement, and share actions
- **Checkout sign-in**: only `/checkout/info`, `/checkout/shipping`, and `/checkout/payment` require a signed-in user (see `src/app/checkout/(protected)/`). **Success / failure** pages do not, so a finished checkout still shows a confirmation if the session ends.
- **Firestore orders**: after “Pay on WhatsApp”, a **session snapshot** of the bag and shipping form (no card fields) is written to the `orders` collection when the user is still signed in—see `firestore.rules`, `src/lib/firebase-orders.ts`, and `src/lib/checkout-order-snapshot.ts`. Deploy rules with the Firebase CLI after enabling Firestore in the console.

## Environment variables

Copy `.env.example` to `.env.local` and add your Firebase **Web app** config (`NEXT_PUBLIC_FIREBASE_*`). Include **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`** for Storage and **`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`** for Analytics (from the same web app snippet). In the Firebase console:

1. Enable **Authentication** → **Email/Password** and **Google** (and add authorized domains, e.g. `localhost` and production).
2. **Firestore**: Create the default database, then from this repo run `firebase deploy --only firestore:rules` (requires [Firebase CLI](https://firebase.google.com/docs/cli) logged into the **lizzy-fusion** project). Production mode is fine once rules are deployed.
3. **Storage**: Enable Cloud Storage for Firebase (default bucket), then run `firebase deploy --only storage` to publish `storage.rules`.
4. **Analytics**: In the project, open **Analytics** (GA4) and ensure the web app has a **Measurement ID** in the config you paste into `.env.local`.

`FIREBASE_WEBAPP_CONFIG` is used automatically on **Firebase App Hosting** builds; local dev normally uses `NEXT_PUBLIC_*` only. After changing env vars, restart `npm run dev`.

Deploy Firestore + Storage rules together:

```bash
firebase deploy --only firestore:rules,storage
```

## Firebase App Hosting (pre-deploy)

Use this before `npm run firebase:deploy:apphosting` or a GitHub-triggered rollout. Replace the example URL with your real App Hosting origin or custom domain.

**Automated checks (run in this repo)**

```bash
npm run lint && npm test && npm run build
```

**App Hosting backend → Environment** (Firebase console → App Hosting → your backend)

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_SITE_URL` | Public origin for Open Graph / canonical URLs (HTTPS, no trailing slash), e.g. `https://YOUR-BACKEND--YOUR-PROJECT.us-central1.hosted.app` |
| `FIREBASE_WEBAPP_CONFIG` **or** `NEXT_PUBLIC_FIREBASE_*` | Client Firebase init (Auth, Firestore, Storage). App Hosting often injects `FIREBASE_WEBAPP_CONFIG` at build time — see [Firebase web config on App Hosting](https://firebase.google.com/docs/app-hosting/firebase-sdks). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH` / `GOOGLE_APPLICATION_CREDENTIALS` | Server: merged catalogue, admin ID token verification, revalidate routes. |
| `GEMINI_API_KEY` | Optional: admin catalogue AI suggest / hero image routes. |

**Firebase Authentication**

- Sign-in methods: **Email/Password** and **Google** enabled.
- **Settings → Authorized domains:** include your App Hosting hostname (and `localhost` for local dev). If you use a **custom domain**, add apex and `www` as needed.

**Google Cloud Console** (same GCP project as Firebase)

- **APIs & Services → Credentials → OAuth 2.0 Web client → Authorized JavaScript origins:** include the exact HTTPS origin where the Next app runs (e.g. `https://…hosted.app` and your custom domain if used).
- If the **Browser** API key uses **HTTP referrer** restrictions, add `https://your-origin/*` for that host.

**Rules**

- After changing `firestore.rules` or `storage.rules`, deploy:  
  `npm run firebase:deploy:rules`  
  (or `firebase deploy --only firestore:rules,storage`).

**Post-rollout smoke test (production URL)**

- Home, shop, PDP, login/register, **Continue with Google** on the live origin.
- `/admin/settings` — **Public site URL** matches `NEXT_PUBLIC_SITE_URL`.
- `/admin/catalog` — connection banner green when Admin credentials and Firestore are configured on the server.

More studio-facing notes (including custom domain) also appear on **`/admin/settings`** in the app.

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
- `firestore.rules` / `storage.rules` / `firebase.json` — Firestore + Storage security rules and CLI wiring
- `AGENTS.md` / `CLAUDE.md` — notes for contributors and AI assistants

## Security notes

- **Card numbers** are not collected for real processing; checkout is WhatsApp-led. Snapshots and Firestore documents **strip** card fields before persistence.
- `npm audit` may still report **moderate** issues in nested `postcss` via `next` until upstream releases a fix; avoid `npm audit fix --force` here (it can pin an incompatible Next version).

## Deploying

This app is a standard Next.js project and can be deployed on [Vercel](https://vercel.com), [Firebase App Hosting](https://firebase.google.com/docs/app-hosting), or any host that supports Node.js. Mirror `.env.local` secrets in the host’s environment UI for production.

**Firebase App Hosting** from this repo:

```bash
npm run firebase:deploy:apphosting
```

See **[Firebase App Hosting (pre-deploy)](#firebase-app-hosting-pre-deploy)** above for env vars, Auth, OAuth, and rules. `apphosting.yaml` and `firebase.json` define the linked backend.

## Repository

Source: [github.com/michael-timi/lizzyfusion_website](https://github.com/michael-timi/lizzyfusion_website)

---

*Lizzy Fusion — empowering modest style with bespoke care, ready-to-wear convenience, and studio training in Osogbo.*
