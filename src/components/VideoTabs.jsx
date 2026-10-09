import { useCallback, useEffect, useRef, useState } from 'react';

/** Horizontally scrolling filename tabs with arrow buttons on both ends. */
const VideoTabs = ({ videos, activeId, onSelect }) => {
    const scroller = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const update = useCallback(() => {
        const el = scroller.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 2);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    useEffect(() => {
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [videos, update]);

    // Keep the active tab in view.
    useEffect(() => {
        scroller.current
            ?.querySelector(`[data-id="${CSS.escape(String(activeId))}"]`)
            ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }, [activeId]);

    const scrollBy = (dir) =>
        scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.7, behavior: 'smooth' });

    const arrow = 'grid shrink-0 place-items-center size-10 rounded-full text-xl transition duration-200 bg-neutral-800 hover:bg-violet-500/30 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100';

    return (
        <nav className='flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-neutral-950/90 backdrop-blur-xl'>
            <button type='button' aria-label='Scroll tabs left' className={arrow} disabled={!canLeft} onClick={() => scrollBy(-1)}>‹</button>
            <div
                ref={scroller}
                onScroll={update}
                className='flex flex-1 gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            >
                {videos.map((v) => (
                    <button
                        key={v.id}
                        data-id={v.id}
                        type='button'
                        title={v.name}
                        onClick={() => onSelect(v)}
                        className={`shrink-0 max-w-[16rem] truncate px-4 py-2 text-sm rounded-full border transition-all duration-300 hover:-translate-y-0.5 ${
                            v.id === activeId ? 'border-violet-300/40 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-950/50' : 'border-white/5 bg-neutral-900 text-neutral-300 hover:border-violet-400/30 hover:bg-neutral-800'
                        }`}
                    >
                        {v.name}
                    </button>
                ))}
            </div>
            <button type='button' aria-label='Scroll tabs right' className={arrow} disabled={!canRight} onClick={() => scrollBy(1)}>›</button>
        </nav>
    );
};

export default VideoTabs;
