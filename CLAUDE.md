# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static multi-page website for **Big Wave BJJ** — a Brazilian Jiu-Jitsu club in Budva, Montenegro (affiliate of KCJJA). No build tools, no frameworks — pure HTML5, CSS3, and vanilla JavaScript (ES6+).

## Architecture

- **4 HTML pages**: `index.html` (landing), `events.html`, `coaches.html`, `contacts.html`
- **CSS**: Single file `css/styles.css` using CSS Custom Properties, Flexbox/Grid, BEM naming
- **JS**: Three files loaded in order: `js/config.js` → `js/i18n.js` → `js/app.js`
  - `config.js`: Site configuration (club info, Telegram bot, Formspree settings)
  - `i18n.js`: Internationalization engine — swaps text via `data-i18n` attributes, caches JSON, supports `file://` protocol
  - `app.js`: IIFE with all UI logic (nav, lang switcher, scroll animations, counters, testimonials slider, events rendering, contact form, Leaflet map)
- **Locales**: `locales/en.json`, `locales/ru.json`, `locales/me.json` — all must have identical key structures
- **Data**: `data/events.json` — events with multilingual fields (`title`, `description`, `location`, `details` are `{en, ru, me}` objects)
- **Assets**: `assets/images/` (logo.svg, avatar-placeholder.svg)

## i18n System

All user-facing text uses `data-i18n="dotpath.key"` attributes. Additional attributes:
- `data-i18n-placeholder` — input placeholders
- `data-i18n-alt` — image alt text
- `data-i18n-html` — innerHTML (rich text)

When adding/changing text, update **all 3 locale files** with matching keys. The `langChanged` custom event fires on language switch — listen to it for dynamic content updates.

## Key Conventions

- Navigation and footer markup must be **identical** across all 4 HTML pages
- Events are rendered dynamically from JSON by `app.js`, not in static HTML
- Map uses Leaflet.js (loaded only on contacts.html via CDN)
- Contact form submits to Telegram Bot API and/or Formspree (configured in `config.js`)
- Must work via `file://` protocol (XHR fallback for JSON loading)
- Scroll animations use Intersection Observer + `.fade-up` / `.fade-in` CSS classes

## Development

Open `index.html` directly in browser, or:
```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Design Tokens (from CSS Custom Properties)

- Primary: `#1B6B93`, Accent: `#3AAFA9`, Background: `#F0F5F9`, Dark: `#1A1A2E`
- Fonts: Montserrat (headings), Inter (body) via Google Fonts
- Breakpoints: mobile <768px, tablet 768-1024px, desktop >1024px

## Configuration (config.js)

Before deploying, update:
- `telegram.botToken` and `telegram.chatId` — create bot via @BotFather, set `enabled: true`
- `formspree.endpoint` — replace `YOUR_FORM_ID`, set `enabled: true`
- `club.mapLat/mapLng` — verify coordinates for map marker
