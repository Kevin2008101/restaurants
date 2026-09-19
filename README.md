# Itán — Modern West African Kitchen

A premium, fully client-side restaurant website. No frameworks, no build step, no external CDNs — every asset is local, so it works offline and deploys anywhere static files are served.

---

## Run it

Any static server works. Two easy options:

```bash
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000
```

or use VS Code's *Live Server* / Netlify / Vercel / GitHub Pages — just upload the folder.

> Open `index.html` directly (file://) and everything still works except the dark map iframe and the fonts pre-cache, which browsers sandbox. A tiny local server is the intended way to view it.

## Structure (deployment-ready, flat)

```
/                        ← deploy this folder; index.html sits at the root
├── index.html           ← all six "pages" (hash-routed sections)
├── style.css            ← design system + responsive rules
├── main.js              ← router, animations, cart, lightbox, forms
├── vercel.json          ← Vercel config (cache headers, clean URLs)
├── README.md
├── fonts/               ← self-hosted Fraunces + Manrope (woff2, latin)
│   ├── fonts.css
│   ├── fraunces-normal.woff2
│   ├── fraunces-italic.woff2
│   └── manrope-normal.woff2
└── img/                 ← 28 optimized JPGs (~2.1 MB total)
```

All asset references are **relative** (`style.css`, `img/hero.jpg`, …) and
**exact-case matched** against the files on disk — verified automatically — so
the site deploys cleanly to Vercel, Netlify, GitHub Pages, or any static host
(case-sensitive Linux filesystems included).

## Deploy to Vercel

**Option A — Dashboard:** push this folder to a Git repo → *Add New Project* on
vercel.com → import → framework preset "Other" → Deploy. Zero build settings
needed; `vercel.json` is picked up automatically.

**Option B — CLI:**
```bash
npm i -g vercel
cd itan
vercel --prod
```

## What's functional

| Feature | Implementation |
|---|---|
| 6 pages | Hash router (`#/home`, `#/menu`, …) — back/forward buttons work, active nav states update |
| Menu filters | Starters / Mains / Desserts / Drinks with animated enter/exit |
| Order cart | Real state in `localStorage` (`itan_cart_v1`), quantity +/−, remove, clear, live total |
| Checkout | Generates a pre-filled **WhatsApp order message** (`wa.me` link) — replace the number (see below) |
| Reservations | Full validation (name, email regex, phone, past-date rejection), saves to `localStorage` (`itan_reservations`), shows confirmation code, lists bookings with cancel |
| Contact form | Validation + success/error banner, saves to `localStorage` (`itan_messages`) |
| Gallery | CSS-columns masonry, lightbox with preloading, arrows, counter, keyboard (←/→/Esc), touch swipe, backdrop-tap close |
| Navigation | Desktop nav, animated mobile overlay menu, back-to-top, hide-on-scroll header |
| Motion | Loader → hero choreography, line-mask text reveals, clip-path image reveals, counters, parallax banners, custom cursor — all disabled or simplified on touch devices and for `prefers-reduced-motion` |

## Customizing

- **Restaurant name / tagline** — search & replace `Itán` and the hero copy in `index.html`.
- **Phone number** — appears in 5 places (`tel:` links ×4, `wa.me/234…` ×1 in `main.js`). Search for `2349012345678`.
- **Menu items** — each dish is an `<article class="dish-card" data-cat="…">` block in `index.html`. Copy one and edit the `data-id`, `data-name`, `data-price` on its *Add* button.
- **Images** — drop a ~1600px JPG into `img/`, keep aspect ratios roughly as the existing files (4:3 dishes, 2:3–3:4 portraits for the gallery). All are progressive JPEGs at q80; keep that for mobile performance.
- **Colors** — edit the token block at the top of `style.css` (`--gold`, `--bg0`, …).

## Connecting a real backend

The front-end is deliberately structured so going live is a three-step change:

1. **Reservations** — in `assets/js/main.js`, find the `setTimeout` inside the `resForm` submit handler. Replace the `store.set('itan_reservations', …)` line with your API call, e.g.:
   ```js
   fetch('https://api.yourrestaurant.com/bookings', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(data)
   }).then(() => { /* show #resSuccess */ });
   ```
   The payload (`{id, name, email, phone, date, time, guests, requests}`) is already API-shaped.
2. **Contact form** — same pattern in the `contactForm` submit handler (`{name, email, subject, message}`).
3. **Orders** — point the `waOrder.href` at your endpoint, or keep WhatsApp (it's a real, working channel).

Until then, the site **labels itself honestly as demo mode** in the success panels — nothing pretends to have reached a restaurant.

## Performance notes

- Total page weight ≈ 0.9–1.3 MB per route (images are lazy-loaded, hero is preloaded + LQIP-free since it's only 237 KB).
- Fonts: 2 woff2 files (~168 KB, variable weight, latin subset), self-hosted, `font-display: swap`.
- Animations are transform/opacity only; parallax and the custom cursor run **desktop-only** (`hover:hover` + `pointer:fine`); scroll work is throttled to `requestAnimationFrame`.
- `prefers-reduced-motion` collapses all choreography to instant states.
- Tested headlessly at 320 / 375 / 390 / 412 / 430 / 768 / 1440 px widths and in landscape: zero horizontal overflow, zero console errors.
