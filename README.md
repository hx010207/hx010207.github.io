# harshit.sec — personal site

Personal landing site for **Harshit S Jain** — B.Tech CSE (Cybersecurity) student, security
& AI engineer. A playful "designer's-canvas" portfolio with a light theme and a
cybersecurity/AI **dark theme** (the default).

## Stack
Plain static site — no build step.
- `index.html` — single-page site (Home / About / Work / Contact sections)
- `services.html` — services page
- `styles.css` — design system + motion
- `script.js` — theme toggle, live clock, scroll/letter/stagger motion, magnetic buttons

## Run locally
```bash
python -m http.server 8099
```
Then open http://127.0.0.1:8099/index.html

## Notes
- Images are placeholders for now — see [`IMAGES.md`](IMAGES.md) for what to provide.
- Contact buttons open WhatsApp (`wa.me/916363885576`).
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
