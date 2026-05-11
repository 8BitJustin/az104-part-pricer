# 🔧 Car Task Pricer

A personal mod tracker and parts budget tool built for my **2025 Acura Integra Type S** build. Plan purchases, track costs, and stay on top of what's coming next.

Built with React, deployed on Vercel, styled to match my AZ-104 Lab Tracker suite.

---

## What It Does

- **Add parts** you're planning to buy — name, price, manufacturer, type, category, and a link to the listing
- **Toggle items** in/out of the running total so you can price out different scenarios (e.g. "what if I skip the exhaust this month?")
- **Live total** updates instantly as you toggle — shows running total, gross total, and how much is currently deducted
- **Category badges** let you see at a glance what area of the car a part targets (Engine, Suspension, Exterior, etc.)
- **Direct links** to part listings so you can jump straight to the product page
- **Persists via localStorage** — your list survives browser closes and reboots; only cleared if you manually wipe browser site data

---

## Planned Features

- **Purchased toggle** — mark items as bought and move them to a separate "What I've Got" list, so the main list stays clean and you keep a full history of completed mods
- Purchase date tracking
- Total spent vs total remaining breakdown
- Export to CSV

---

## Tech Stack

- React (JSX)
- localStorage for persistence
- IBM Plex Mono + Space Grotesk (Google Fonts)
- Deployed via Vercel

---

## The Build

**Car:** 2025 Acura Integra Type S

The Type S is a 2.0L turbocharged K20C1, 320hp, 310 lb-ft, 6-speed manual only. This tracker exists to keep the mod list organized and the wallet from getting completely out of hand.

---

## Local Dev

```bash
npm install
npm run dev
```

Requires a React project scaffold (Vite or Create React App). Drop `car-task-pricer.jsx` into your `src/` directory and import it as the root component.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
