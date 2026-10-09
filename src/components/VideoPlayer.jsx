import { useEffect, useRef, useState } from 'react';

const fmt = (s) => {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/** Video player with custom playback, volume, seek, and fullscreen controls. */
const VideoPlayer = ({ src, title }) => {
    const ref = useRef(null);
    const playerRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.play().catch(() => {
            el.muted = true;
            setMuted(true);
            el.play().catch(() => {});
        });
    }, []);

    useEffect(() => {
        const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === playerRef.current);
        document.addEventListener('fullscreenchange', syncFullscreen);
        return () => document.removeEventListener('fullscreenchange', syncFullscreen);
    }, []);

    // Keyboard shortcuts: Space = play/pause, ←/→ = ±10s, M = mute, F = fullscreen.
    useEffect(() => {
        const onKey = (e) => {
            const el = ref.current;
            if (!el || e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
            if (e.code === 'Space') { e.preventDefault(); if (el.paused) el.play().catch(() => {}); else el.pause(); }
            if (e.code === 'ArrowRight') el.currentTime = Math.min(el.currentTime + 10, el.duration || 0);
            if (e.code === 'ArrowLeft') el.currentTime = Math.max(0, el.currentTime - 10);
            if (e.key.toLowerCase() === 'm') el.muted = !el.muted;
            if (e.key.toLowerCase() === 'f') toggleFullscreen();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const toggle = () => {
        const el = ref.current;
        if (!el) return;
        if (el.paused) el.play().catch(() => {});
        else el.pause();
    };
    async function toggleFullscreen() {
        const target = playerRef.current;
        if (!target) return;
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else if (target.requestFullscreen) await target.requestFullscreen();
            else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
        } catch {
            setError('Fullscreen is unavailable in this browser.');
        }
    }
    const skip = (d) => {
        const el = ref.current;
        if (el) el.currentTime = Math.min(Math.max(0, el.currentTime + d), el.duration || 0);
    };
    const toggleMute = () => {
        const el = ref.current;
        if (!el) return;
        el.muted = !el.muted;
        if (!el.muted && el.volume === 0) el.volume = 0.5;
    };
    const changeVolume = (v) => {
        const el = ref.current;
        if (!el) return;
        el.volume = v;
        el.muted = v === 0;
    };

    const btn = 'grid place-items-center size-10 rounded-full text-lg text-neutral-200 hover:bg-white/15 hover:text-white hover:scale-110 active:scale-95 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400';

    return (
        <div ref={playerRef} className='video-player flex flex-col w-full max-w-6xl mx-auto overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl shadow-violet-950/20'>
            <div className='relative bg-black aspect-video' onClick={toggle}>
                <video
                    ref={ref}
                    src={src}
                    playsInline
                    preload='metadata'
                    className='w-full h-full object-contain'
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onVolumeChange={(e) => { setVolume(e.currentTarget.volume); setMuted(e.currentTarget.muted); }}
                    onError={() => setError('This video could not be loaded.')}
                />
                {!playing && !error && <div className='pointer-events-none absolute inset-0 grid place-items-center bg-gradient-to-t from-black/35 to-transparent'><span className='grid size-16 place-items-center rounded-full border border-white/20 bg-black/35 text-2xl text-white backdrop-blur-sm'>▶</span></div>}
                {error && <div className='absolute inset-0 grid text-sm text-red-300 place-items-center bg-black/70'>{error}</div>}
            </div>

            <div className='flex flex-col gap-2 px-3 py-3 sm:px-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950'>
                <input
                    type='range' min={0} max={duration || 0} step={0.1} value={time}
                    onChange={(e) => { if (ref.current) ref.current.currentTime = Number(e.target.value); }}
                    aria-label='Seek' className='seek-range w-full accent-violet-400'
                />
                <div className='flex flex-wrap items-center gap-1'>
                    <button type='button' className={btn} onClick={() => skip(-10)} aria-label='Back 10 seconds' title='Back 10 seconds'>⏪</button>
                    <button type='button' className={`${btn} bg-violet-500/15`} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause' : 'Play'}>{playing ? '⏸' : '▶'}</button>
                    <button type='button' className={btn} onClick={() => skip(10)} aria-label='Forward 10 seconds' title='Forward 10 seconds'>⏩</button>
                    <span className='ml-2 text-xs tabular-nums text-neutral-300'>{fmt(time)} / {fmt(duration)}</span>
                    <span className='flex-1 hidden mx-3 text-sm truncate sm:block text-neutral-400'>{title}</span>
                    <button type='button' className={btn} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'}>
                        {muted || volume === 0 ? '🔇' : '🔊'}
                    </button>
                    <input
                        type='range' min={0} max={1} step={0.05} value={muted ? 0 : volume}
                        onChange={(e) => changeVolume(Number(e.target.value))}
                        aria-label='Volume' className='volume-range w-20 sm:w-24 accent-violet-400'
                    />
                    <button type='button' className={`${btn} ml-1`} onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title={`${isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} (F)`}>
                        {isFullscreen ? (
                            <svg aria-hidden='true' viewBox='0 0 24 24' className='size-5' fill='none' stroke='currentColor' strokeWidth='2'><path d='M8 3v5H3M16 3v5h5M3 16h5v5m8 0v-5h5' /></svg>
                        ) : (
                            <svg aria-hidden='true' viewBox='0 0 24 24' className='size-5' fill='none' stroke='currentColor' strokeWidth='2'><path d='M3 9V3h6M21 9V3h-6M3 15v6h6m12-6v6h-6' /></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
