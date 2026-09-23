import { useState } from 'react';
import VideoHero from './components/VideoHero';
import { SAMPLE_VIDEOS } from './lib/videoSource';

/**
 * Demo shell.
 *
 * The only thing that matters for reuse is <VideoHero url={...} />.
 * Everything below it is a playground for pasting URLs.
 */
const App = () => {
    const [url, setUrl] = useState(SAMPLE_VIDEOS[0].url);
    const [draft, setDraft] = useState(SAMPLE_VIDEOS[0].url);

    const apply = (e) => {
        e.preventDefault();
        setUrl(draft.trim());
    };

    return (
        <main className='min-h-screen text-white bg-black'>
            <VideoHero
                key={url}
                url={url}
                title='Video Hero'
                tagline='Any public video URL — MP4, WebM, YouTube or Vimeo — rendered as a full-bleed background.'
            />

            <section className='max-w-3xl px-5 py-12 mx-auto sm:px-8'>
                <h2 className='text-xl font-semibold sm:text-2xl'>Try a URL</h2>
                <p className='mt-2 text-sm text-neutral-400'>
                    Paste a direct media link (.mp4 / .webm) or a YouTube / Vimeo page URL.
                </p>

                <form onSubmit={apply} className='flex flex-col gap-3 mt-5 sm:flex-row'>
                    <input
                        type='url'
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder='https://example.com/video.mp4'
                        className='flex-1 px-4 py-3 text-sm border rounded-md outline-none bg-neutral-900 border-neutral-700 placeholder:text-neutral-600 focus:border-neutral-400'
                    />
                    <button
                        type='submit'
                        className='px-6 py-3 text-sm font-semibold text-black transition bg-white rounded-md hover:bg-neutral-200 active:scale-95'
                    >
                        Load
                    </button>
                </form>

                <div className='flex flex-wrap gap-2 mt-5'>
                    {SAMPLE_VIDEOS.map((sample) => (
                        <button
                            key={sample.url}
                            type='button'
                            onClick={() => {
                                setDraft(sample.url);
                                setUrl(sample.url);
                            }}
                            className='px-3 py-2 text-xs transition border rounded-full border-neutral-700 text-neutral-300 hover:border-neutral-400 hover:text-white'
                        >
                            {sample.label}
                        </button>
                    ))}
                </div>

                <div className='p-4 mt-8 border rounded-md border-neutral-800 bg-neutral-950'>
                    <h3 className='text-sm font-semibold text-neutral-200'>Usage</h3>
                    <pre className='mt-3 overflow-x-auto text-xs text-neutral-400'>
{`import VideoHero from './components/VideoHero';

<VideoHero
    url="https://example.com/clip.mp4"
    title="Your Title"
    tagline="Your subtitle"
    posterUrl="https://example.com/poster.jpg"
/>`}
                    </pre>
                </div>
            </section>
        </main>
    );
};

export default App;
