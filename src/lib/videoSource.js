/**
 * Normalises any "public video URL" into something the hero can render.
 *
 * Three cases are handled, because they are NOT interchangeable:
 *
 *   1. `file`     — a direct link to a media file (.mp4/.webm/.ogv/.mov/.m4v).
 *                   Rendered with a native <video>. This is the only kind that
 *                   can be truly object-fit: cover'd with no letterboxing.
 *
 *   2. `hls`      — an .m3u8 stream. Safari plays it natively; other browsers
 *                   need hls.js, which is NOT a dependency here. We detect it
 *                   and surface a clear message instead of failing silently.
 *
 *   3. `embed`    — YouTube / Vimeo. These CANNOT be played in a <video> tag.
 *                   They must be an <iframe>, and an iframe's internal content
 *                   ignores object-fit, so it has to be overscaled to hide the
 *                   letterboxing (same trick as a scale-[1.8] hero).
 *
 * Anything unrecognised is returned as `file` on the optimistic assumption that
 * it is a direct media link served without a conventional extension (common for
 * CDN/signed URLs). The <video> error handler is the safety net.
 */

const FILE_EXTENSIONS = ['.mp4', '.webm', '.ogv', '.ogg', '.mov', '.m4v'];

/** Extracts an 11-character YouTube id from any of its URL shapes. */
const parseYouTubeId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
        /(?:youtu\.be\/)([\w-]{11})/,
        /(?:youtube\.com\/embed\/)([\w-]{11})/,
        /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

/** Extracts the numeric id from a Vimeo URL. */
const parseVimeoId = (url) => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
};

export const resolveVideoSource = (rawUrl) => {
    const url = (rawUrl || '').trim();

    if (!url) {
        return { kind: 'none', reason: 'No video URL provided.' };
    }

    // Reject anything that isn't http(s) — blocks javascript:/data: injection
    // from a URL that may have come from user input.
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return { kind: 'error', reason: 'That is not a valid URL.' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { kind: 'error', reason: 'Only http and https URLs are supported.' };
    }

    const youTubeId = parseYouTubeId(url);
    if (youTubeId) {
        const params = new URLSearchParams({
            autoplay: '1',
            mute: '1',
            controls: '0',
            loop: '1',
            playlist: youTubeId, // `loop` only repeats a single video via `playlist`
            modestbranding: '1',
            rel: '0',
            playsinline: '1',
            disablekb: '1',
        });
        return {
            kind: 'embed',
            provider: 'youtube',
            src: `https://www.youtube.com/embed/${youTubeId}?${params}`,
        };
    }

    const vimeoId = parseVimeoId(url);
    if (vimeoId) {
        const params = new URLSearchParams({
            autoplay: '1',
            muted: '1',
            loop: '1',
            background: '1', // Vimeo's own chrome-less background mode
        });
        return {
            kind: 'embed',
            provider: 'vimeo',
            src: `https://player.vimeo.com/video/${vimeoId}?${params}`,
        };
    }

    const pathname = parsed.pathname.toLowerCase();

    if (pathname.endsWith('.m3u8')) {
        return {
            kind: 'hls',
            src: url,
            reason: 'HLS streams play natively in Safari only. Add hls.js for other browsers.',
        };
    }

    const hasKnownExtension = FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext));

    return {
        kind: 'file',
        src: url,
        // Signals the UI to warn that this is a best-effort guess.
        uncertain: !hasKnownExtension,
    };
};

/** Sample public-domain clips for the demo picker. */
export const SAMPLE_VIDEOS = [
    {
        label: 'Big Buck Bunny (MP4)',
        url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4',
    },
    {
        label: 'Sintel trailer (MP4)',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    },
    {
        label: 'Flower (WebM)',
        url: 'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/360/Big_Buck_Bunny_360_10s_1MB.webm',
    },
];
