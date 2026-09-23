# Implementation Notes

How the background video actually works, and why each decision was made.

## The core problem

"Play a video as a hero background" splits into two incompatible rendering paths:

| | Direct file | YouTube / Vimeo |
|---|---|---|
| Element | `<video>` | `<iframe>` |
| `object-fit: cover` | works | **ignored** |
| Letterboxing | none | baked into the iframe |
| Fill technique | `object-cover` | overscale + clip |
| Mute control | `el.muted` | postMessage / URL param |
| Error detection | `onError` fires | cross-origin, no signal |

`src/lib/videoSource.js` classifies the URL up front so the component renders the right one.

## Step 1 — classify the URL

```js
export const resolveVideoSource = (rawUrl) => { … }
```

Returns one of:

| `kind` | Meaning |
|---|---|
| `file` | Direct media — render `<video>` |
| `embed` | YouTube/Vimeo — render `<iframe>` |
| `hls` | `.m3u8` — `<video>`, Safari only |
| `none` | Empty input — show prompt |
| `error` | Malformed or non-http scheme |

Unknown extensions resolve to `file` with `uncertain: true`, because signed CDN URLs routinely omit an extension. The `<video>` `onError` handler is the fallback.

### Security

```js
if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { kind: 'error', reason: 'Only http and https URLs are supported.' };
}
```

Without this, a pasted `javascript:` or `data:` URL reaches a DOM sink. `new URL()` also rejects malformed input, so both checks are needed.

## Step 2 — the file path (preferred)

```jsx
<video
    src={source.src}
    autoPlay muted loop playsInline
    onError={() => setFailed(true)}
    className='absolute inset-0 w-full h-full object-cover'
/>
```

`object-cover` does all the work — fills any aspect ratio, crops the overflow, no letterboxing.

Attribute rationale:

| Attribute | Why it is mandatory |
|---|---|
| `muted` | Unmuted autoplay is blocked everywhere |
| `playsInline` | Without it iOS hijacks into native fullscreen |
| `loop` | Background video should not stop |
| `preload='auto'` | Reduces first-frame delay |
| `poster` | Something to show while decoding |

## Step 3 — the embed path

An iframe's content ignores `object-fit`, so the letterboxing has to be pushed outside the clip box:

```jsx
className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
           w-full h-full min-w-[177.77vh] min-h-[56.25vw]
           scale-125 pointer-events-none select-none'
```

- `min-w-[177.77vh]` — 16/9 = 1.7777. Guarantees ≥16:9 relative to height.
- `min-h-[56.25vw]` — 9/16 = 0.5625. The same guarantee on the other axis.
- Together they ensure the iframe always **exceeds** the container on both axes.
- `scale-125` absorbs the provider's own internal padding.
- `pointer-events-none` stops YouTube stealing clicks and showing its overlay.

`loop=1` alone does nothing on YouTube — it also needs `playlist=<same id>`. That is a documented API quirk, not a workaround:

```js
loop: '1',
playlist: youTubeId,
```

## Step 4 — state reset without cascading renders

First attempt used an effect:

```js
// REJECTED
useEffect(() => { setFailed(false); setReady(false); }, [url]);
```

`eslint-plugin-react-hooks` v7 flags this as `react-hooks/set-state-in-effect` — it causes a second render pass on every URL change.

The idiomatic fix is to let React discard the state:

```jsx
<VideoHero key={url} url={url} … />
```

A changed `key` remounts the component, so `failed` and `ready` reset to their initial values with no extra render. Documented in `VideoHero.jsx` so nobody reintroduces the effect.

## Step 5 — lifecycle guards

Autoplay rejection must be caught or it surfaces as an unhandled promise rejection:

```js
const attempt = el.play();
if (attempt?.catch) attempt.catch(() => {});
```

Hidden tabs pause, to avoid decoding video nobody is watching:

```js
const onVisibility = () => {
    if (document.hidden) el.pause();
    else el.play()?.catch(() => {});
};
document.addEventListener('visibilitychange', onVisibility);
```

## Step 6 — legibility

Two scrims sit between video and text:

```jsx
<div className='… bg-gradient-to-t from-black/85 via-black/25 to-transparent' />
<div className='… bg-gradient-to-r from-black/75 via-black/20 to-transparent' />
```

Static text over moving footage fails contrast unpredictably — the frame behind a given word changes every frame. The bottom scrim guarantees a floor; the left one anchors the text column.

The video layer is masked so it dissolves into the page instead of ending on a hard line:

```
[mask-image:linear-gradient(to_bottom,black_45%,transparent_99%)]
```

## Mobile

- `h-[100svh]` — small-viewport unit. Plain `100vh` overflows under mobile browser chrome.
- `min-h-[420px]` — protects landscape phones.
- Type and padding scale at `sm:` / `lg:`.
- `active:scale-95` gives touch feedback where there is no hover.
- `prefers-reduced-motion` honoured in `index.css`.

## Tests

`src/lib/videoSource.test.mjs` — 11 cases, `node --test`, no test framework dependency.

Covers: all four YouTube URL shapes, `v=` not being the first query param, the `loop`+`playlist` pairing, Vimeo, HLS, uppercase extensions, extensionless CDN URLs, empty input, and rejection of `javascript:` / `data:` / malformed URLs.

```bash
npm test
```

## Deliberate omissions

| Not included | Why |
|---|---|
| `hls.js` | ~200 kB for a case most users do not hit. Detected and reported instead. |
| `react-player` | Large dependency; two `if` branches cover the same ground. |
| TypeScript | Matches the existing JS/JSX convention. |
| `tailwind.config.js` | Tailwind v4 configures via CSS. A config file here would mislead. |
