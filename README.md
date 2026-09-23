# Video Hero

Standalone React app. Paste any **public video URL** and it renders as a full-bleed hero background.

Completely independent — no connection to MovieMars or any other project.

## Stack

| Layer | Choice |
|---|---|
| UI | React 19 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Animation | framer-motion |
| Language | JavaScript / JSX |

## Run

```bash
cd "video code"
npm install
npm run dev
```

Opens on <http://localhost:5173>.

| Script | Does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production bundle to `dist/` |
| `npm run preview` | Serve the built bundle |
| `npm run lint` | ESLint |
| `npm test` | URL-parser unit tests |

## Usage

```jsx
import VideoHero from './components/VideoHero';

<VideoHero
    key={url}                  // remount on change -> resets error state
    url="https://example.com/clip.mp4"
    title="Your Title"
    tagline="Your subtitle"
    posterUrl="https://example.com/poster.jpg"
/>
```

### Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `url` | string | — | Any public video URL |
| `title` | string | `'Your Title Here'` | Headline |
| `tagline` | string | … | Sub-copy |
| `posterUrl` | string | `''` | Still shown before the first frame decodes |

## Supported URL types

| Kind | Example | How it renders |
|---|---|---|
| Direct file | `…/clip.mp4`, `.webm`, `.mov`, `.m4v` | `<video>` + `object-cover` |
| YouTube | `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…` | `<iframe>`, overscaled |
| Vimeo | `vimeo.com/123456` | `<iframe>` in `background=1` mode |
| HLS | `…/index.m3u8` | `<video>` — **Safari only** without `hls.js` |

Non-`http(s)` URLs (`javascript:`, `data:`) are rejected before reaching the DOM.

## Why a direct file URL is the better choice

A real `<video>` can be `object-fit: cover`'d, so it fills the hero with **zero letterboxing** at any aspect ratio.

An iframe cannot. Its internal content ignores `object-fit`, so YouTube/Vimeo embeds must be **overscaled** (`scale-125` + `min-w-[177.77vh]`) to push the black bars outside the clip box. That works, but it crops more aggressively and you cannot control exactly how much.

Prefer a direct `.mp4`/`.webm` when you control the asset.

## Things that will bite you

1. **Autoplay requires `muted`.** Every modern browser blocks unmuted autoplay. The video starts muted and `play()` rejections are swallowed. Unmuting must come from a click — that is what the speaker toggle is for.
2. **CORS / hotlink protection.** Many hosts refuse to serve media cross-origin. If a URL works in a browser tab but not here, that is why. Dropbox/Google Drive share links do **not** work — they serve HTML, not video.
3. **`100svh`, not `100vh`.** On mobile, `100vh` is taller than the visible viewport, so the hero gets clipped by the browser chrome. `svh` fixes it.
4. **Hidden tabs pause.** A `visibilitychange` listener pauses playback in a background tab to save CPU and battery.
5. **HLS is Safari-only here.** `hls.js` is intentionally not a dependency. Add it if you need Chrome/Firefox stream support.

## Layout

The hero is five stacked layers:

```
Layer 5  status pill        (errors / hints)
Layer 4  mute toggle        (file + HLS only)
Layer 3  title, copy, CTAs
Layer 2  gradient scrims    (keeps text legible over motion)
Layer 1  the video          (masked to fade out at the bottom)
```

## Structure

```
video code/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── .gitignore
├── README.md
├── md/
│   └── IMPLEMENTATION.md
└── src/
    ├── main.jsx
    ├── App.jsx                  demo shell + URL input
    ├── index.css                Tailwind v4 entry
    ├── components/
    │   └── VideoHero.jsx        the reusable hero
    └── lib/
        ├── videoSource.js       URL -> render strategy
        └── videoSource.test.mjs 11 unit tests
```
