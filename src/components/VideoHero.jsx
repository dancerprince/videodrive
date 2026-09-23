import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { resolveVideoSource } from '../lib/videoSource';

/**
 * Full-bleed hero with a video playing as the background.
 *
 * Pass any public video URL via the `url` prop.
 */
const VideoHero = ({
    url,
    title = 'Your Title Here',
    tagline = 'Paste any public video URL and it plays right here as the hero background.',
    posterUrl = '',
}) => {
    const source = useMemo(() => resolveVideoSource(url), [url]);

    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    const [failed, setFailed] = useState(false);
    const [ready, setReady] = useState(false);

    // NOTE: `failed`/`ready` are deliberately NOT reset via an effect here.
    // App.jsx passes `key={url}` so a new URL remounts this component, which
    // resets all state for free and avoids a cascading render.

    // Autoplay is only permitted while muted. Browsers reject the promise if
    // the policy blocks it, so we catch rather than let it go unhandled.
    useEffect(() => {
        const el = videoRef.current;
        if (!el || source.kind !== 'file') return;

        el.muted = true;
        const attempt = el.play();
        if (attempt?.catch) attempt.catch(() => {});
    }, [source]);

    // Pause in a hidden tab so a background video does not burn CPU/battery.
    useEffect(() => {
        const onVisibility = () => {
            const el = videoRef.current;
            if (!el) return;
            if (document.hidden) {
                el.pause();
            } else {
                const attempt = el.play();
                if (attempt?.catch) attempt.catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    const toggleMute = () => {
        const el = videoRef.current;
        if (!el) return;
        el.muted = !el.muted;
        setIsMuted(el.muted);
    };

    const showFallback = failed || source.kind === 'none' || source.kind === 'error';

    return (
        <section className='relative w-full h-[100svh] min-h-[420px] overflow-hidden bg-black'>
            {/* ---------- Layer 1: the video itself ---------- */}
            <div className='absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_99%)]'>
                {source.kind === 'file' && !failed && (
                    <video
                        ref={videoRef}
                        src={source.src}
                        poster={posterUrl || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload='auto'
                        onCanPlay={() => setReady(true)}
                        onError={() => setFailed(true)}
                        /* object-cover works on a real <video>: no letterboxing,
                           no overscale hack needed. */
                        className='absolute inset-0 w-full h-full object-cover'
                    />
                )}

                {source.kind === 'hls' && !failed && (
                    <video
                        ref={videoRef}
                        src={source.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        onCanPlay={() => setReady(true)}
                        onError={() => setFailed(true)}
                        className='absolute inset-0 w-full h-full object-cover'
                    />
                )}

                {source.kind === 'embed' && (
                    /* An iframe ignores object-fit, so the 16:9 letterboxing has
                       to be pushed outside the clip box by overscaling. */
                    <iframe
                        src={source.src}
                        title={title}
                        allow='autoplay; fullscreen; encrypted-media; picture-in-picture'
                        referrerPolicy='strict-origin-when-cross-origin'
                        className='absolute top-1/2 left-1/2 border-0 -translate-x-1/2 -translate-y-1/2
                                   w-full h-full min-w-[177.77vh] min-h-[56.25vw]
                                   scale-125 pointer-events-none select-none'
                    />
                )}

                {showFallback && (
                    <div className='absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black' />
                )}
            </div>

            {/* ---------- Layer 2: gradient scrims for text legibility ---------- */}
            <div className='absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/25 to-transparent' />
            <div className='absolute inset-0 pointer-events-none bg-gradient-to-r from-black/75 via-black/20 to-transparent' />

            {/* ---------- Layer 3: foreground content ---------- */}
            <div className='relative z-10 flex flex-col justify-end h-full px-5 pb-16 sm:px-10 sm:pb-20 lg:px-16 lg:pb-24'>
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className='max-w-2xl'
                >
                    <h1 className='text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl drop-shadow-lg'>
                        {title}
                    </h1>
                    <p className='mt-4 text-sm leading-relaxed text-neutral-200 sm:text-base lg:text-lg'>
                        {tagline}
                    </p>

                    <div className='flex flex-wrap items-center gap-3 mt-7'>
                        <button
                            type='button'
                            className='px-6 py-3 text-sm font-semibold text-black transition bg-white rounded-md sm:text-base hover:bg-neutral-200 active:scale-95'
                        >
                            Play Trailer
                        </button>
                        <button
                            type='button'
                            className='px-6 py-3 text-sm font-semibold text-white transition rounded-md sm:text-base bg-white/20 backdrop-blur-sm hover:bg-white/30 active:scale-95'
                        >
                            More Info
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* ---------- Layer 4: mute toggle (file/HLS only) ---------- */}
            {(source.kind === 'file' || source.kind === 'hls') && !showFallback && (
                <button
                    type='button'
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                    className='absolute z-20 grid text-white transition border rounded-full right-5 bottom-16 sm:bottom-20 lg:right-16 size-11 place-items-center border-white/40 bg-black/40 backdrop-blur-sm hover:bg-black/60 active:scale-95'
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>
            )}

            {/* ---------- Layer 5: status messages ---------- */}
            {source.kind === 'none' && (
                <div className='absolute z-20 -translate-x-1/2 top-6 left-1/2'>
                    <span className='px-4 py-2 text-xs rounded-full sm:text-sm bg-white/10 text-neutral-200 backdrop-blur-sm'>
                        Paste a public video URL to begin
                    </span>
                </div>
            )}

            {(source.kind === 'error' || failed) && (
                <div className='absolute z-20 -translate-x-1/2 top-6 left-1/2 max-w-[90vw]'>
                    <span className='block px-4 py-2 text-xs text-center text-red-200 rounded-full sm:text-sm bg-red-500/20 backdrop-blur-sm'>
                        {source.reason || 'That video could not be loaded. Check the URL is public and allows hotlinking.'}
                    </span>
                </div>
            )}

            {source.kind === 'hls' && !ready && !failed && (
                <div className='absolute z-20 -translate-x-1/2 top-6 left-1/2 max-w-[90vw]'>
                    <span className='block px-4 py-2 text-xs text-center rounded-full sm:text-sm bg-amber-500/20 text-amber-100 backdrop-blur-sm'>
                        {source.reason}
                    </span>
                </div>
            )}
        </section>
    );
};

export default VideoHero;
