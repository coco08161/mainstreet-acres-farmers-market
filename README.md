# The Farmers Market at Mainstreet Acres

Vendor recruitment site for Mainstreet Acres Farmers Market (Redland, Miami). Plain HTML, CSS, and JS. No build step.
Live: https://coco08161.github.io/mainstreet-acres-farmers-market/

## Pages
- `index.html`: home (photo hero, product marquee, Saturday/Sunday market cards, story, seven vendor "seed packets", why join, chalkboard details + map, apply CTA)
- `vendors.html`: three steps (stacking cards), who we welcome, what we look for, FAQ
- `apply.html`: vendor registration form + contact card
- `about.html`: story, values, what you'll find on a market day

## Design and motion (redesign, 2026-11-24)
- Brand from the logo: forest green, hay gold, honey, tomato, kraft paper; Fraunces + Instrument Sans + Caveat. Awning stripe and chalkboard as signature pieces.
- **GSAP 3.12.5 + ScrollTrigger** (cdnjs): hero line reveal, scroll reveals, clip-path photo reveals, scroll-highlighted statements, stacking step cards, parallax title, magnetic buttons, scroll progress bar.
- Effects modeled on **Skiper UI** (words intro "Fresh. / Local. / Every weekend.", text-roll nav, expand-on-hover seed packets, card stack, text scroll reveal) and **Componentry** (scroll-velocity marquee, magnetic buttons, animated WebGL gradient behind the CTA), rewritten in plain JS.
- Respects "reduce motion". If GSAP doesn't load, all content still shows.

## Form safety
FormSubmit AJAX → stephanie@cmgproducts.net. 12 s timeout, no double sends, loading and error states (keeps what the vendor typed, shows email fallback), honeypot, length limits, blank-only answers rejected. `apply.html?day=Saturday` pre-checks that day; picking a food/dairy category shows the Florida license field.

## Before launch
- **Photos** in `assets/img/` are Unsplash placeholders (saved locally as WebP). Replace with real market photos, same file names.
- **Logo**: `assets/logo.webp`. Swap in final files when they arrive.
- **Vendor rates**: market cards say "Contact us for current rates" until real prices are given.
- **Form**: the first submission sends an activation email to stephanie@cmgproducts.net. Click the link once.
- About page says "We started the market…" — confirm the real story.

## Hosting
GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
