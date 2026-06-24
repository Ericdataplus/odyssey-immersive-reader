# 📜 The Odyssey — Immersive Illustrated Edition

Experience Homer's *Odyssey* as a fully illustrated audiobook with synchronized narration, cinematic scene artwork, and a two-column "book" reading view.

## Overview

This is a static web reader that pairs the text of Homer's *Odyssey* (Samuel Butler's public-domain translation) with audio narration and visual art. As the narration plays, the current paragraph is highlighted, pages turn automatically, and inline illustrations — both still images and short animated scenes — appear alongside the text. You can scrub, change speed, adjust volume, jump between chapters, and click any paragraph to seek the audio to that point.

The reader is data-driven: a manifest lists chapters, and each chapter's metadata file maps every paragraph to a start/end timestamp, an illustration, and narration details. This makes the experience fully synchronized without any hardcoded timing in the UI.

## 🛠 Tech stack

- **Frontend:** Vanilla JavaScript, HTML, CSS (no framework)
- **Typography:** Google Fonts (Cormorant Garamond, Inter, Outfit)
- **Media:** HTML5 `<audio>` for narration; PNG illustrations and MP4 animated scenes
- **Data:** JSON manifest + per-chapter metadata (paragraph timings, illustrations, narration mood/voice)
- **Hosting:** GitHub Pages (workflows in `.github/workflows/`, `.nojekyll`)

## ✨ Features

- **Synchronized narration** — the active paragraph highlights in time with the audio
- **Auto page turns** — the two-column reader advances pages as narration progresses
- **Inline scene art** — illustrations and short animated (MP4) scenes embedded between paragraphs
- **Click-to-seek** — click any paragraph to jump the audio to that moment
- **Full transport controls** — play/pause, previous/next chapter, scrubbable progress bar
- **Playback options** — adjustable speed (0.5×–2×) and volume
- **Chapter selector** — dropdown to jump between books
- **Keyboard support** — spacebar play/pause and page navigation

## 🚀 Getting started

This is a static site — no build step required. Serve the folder over HTTP (needed so the browser can `fetch` the manifest and metadata):

```bash
# Python 3
python -m http.server 8000

# or any static file server
npx serve .
```

Then open `http://localhost:8000`.

## 📌 Status

A personal, evolving project. Book I is fully produced (narration, illustrations, and animated scenes); additional books can be added by dropping new audio, art, and metadata into the `audiobook/` directory and extending the manifest. The translation used is in the public domain.
