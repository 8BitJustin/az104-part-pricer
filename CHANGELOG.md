# Changelog — Car Task Pricer

All notable changes to this project will be documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [v1.2.0] — 2025-05-11

### Added
- **Drag-and-drop reordering** - items can not be reordered by dragging  the ⠿ handle on the left side of each card.
- Added @hello-pangea/dnd as a dependency (React 19-compatible fork of react-beautiful-dnd).

### Changed
- Footer hint updated to reflect the new drag handle alongside the existing toggle instruction.

## [v1.1.0] — 2025-05-11

### Added
- **Category field** (optional) — tag each part with an area of the car (e.g. Engine, Exterior, Interior). Displays as an amber badge on the part card for quick visual scanning.
- **Link to Part field** (optional) — store a URL to the part listing online. Renders as a cyan "↗ View Part" pill on the card that opens in a new tab.

---

## [v1.0.0] — 2025-05-11

### Added
- Initial release of Car Task Pricer.
- Add, edit, and delete parts from a dynamic list.
- Required fields: **Name** and **Price**.
- Optional fields: **Manufacturer** and **Type / Description**.
- **Running Total** header box showing the live sum of all included parts.
- **All Parts** gross total displayed alongside the running total.
- Per-item **toggle switch** to include or exclude a part from the running total — excluded items are dimmed and their price is struck through.
- **Deducted** amount shown when one or more items are excluded.
- **localStorage persistence** — parts list survives browser closes, tab refreshes, and system reboots. Data is only cleared if the user manually clears browser site data.
- Dark navy theme matching the AZ-104 Lab Tracker, using IBM Plex Mono and Space Grotesk fonts, with cyan and green accents.
