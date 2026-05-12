# Lizzy Fusion

**Modesty Redefined, Style Redesigned**

Official marketing and storefront-style site for **Lizzy Fusion** — modest fashion, bespoke and ready-to-wear, based in **Osogbo, Osun State, Nigeria**. The live experience is built with Next.js and presents collections, custom tailoring, training, and contact flows aligned with the studio’s vision.

## What’s in this repo

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4** for layout and styling
- Pages for **Home**, **Shop**, **Custom / Bespoke**, **Training**, **Apprentices**, **About**, and **Contact**
- Shared **brand, contact, and navigation** copy in `src/lib/site.ts` (single place to update phone, email, WhatsApp, vision, mission, and offerings)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run start`| Serve production   |
| `npm run lint` | ESLint             |

## Project layout (high level)

- `src/app/` — routes and layouts (`page.tsx`, `layout.tsx`, `globals.css`)
- `src/components/` — header, footer, forms, layout chrome
- `public/brand/` — logo and brand overview assets
- `AGENTS.md` / `CLAUDE.md` — notes for contributors and AI assistants working in this repo

## Deploying

This app is a standard Next.js project and can be deployed on [Vercel](https://vercel.com) or any host that supports Node.js. Set environment variables in your host’s dashboard if you add secrets later; today’s content is mostly static and driven by `src/lib/site.ts`.

## Repository

Source: [github.com/michael-timi/lizzyfusion_website](https://github.com/michael-timi/lizzyfusion_website)

---

*Lizzy Fusion — empowering modest style with bespoke care, ready-to-wear convenience, and studio training in Osogbo.*
