import { useState } from 'react';
import VideoTabs from './components/VideoTabs';
import VideoPlayer from './components/VideoPlayer';
import SettingsDialog from './components/SettingsDialog';
import { useVideoCatalog } from './hooks/useVideoCatalog';
import { useFolderSetting } from './hooks/useFolderSetting';

const App = () => {
    const [folderUrl, setFolderUrl] = useFolderSetting();
    const { videos, loading, error } = useVideoCatalog(folderUrl);
    const [active, setActive] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const notice = error ? `Could not load videos: ${error}` : '';

    const saveFolder = (url) => {
        setActive(null);
        setFolderUrl(url);
    };

    return (
        <main className='app-shell flex flex-col min-h-screen text-white bg-[#08080c]'>
            <div className='flex items-center bg-neutral-950'>
                <div className='flex-1 min-w-0'>
                    <VideoTabs videos={videos} activeId={active?.id} onSelect={setActive} />
                </div>
                <button
                    type='button'
                    aria-label='Settings'
                    title='Settings'
                    onClick={() => setShowSettings(true)}
                    className='grid mr-3 text-xl transition rounded-full shrink-0 place-items-center size-10 bg-neutral-800 hover:bg-neutral-700'
                >
                    ⚙
                </button>
            </div>
            {notice && <p className='px-4 py-2 text-xs text-amber-200 bg-amber-500/10'>{notice}</p>}
            <section className='player-stage flex items-center justify-center flex-1 p-3 sm:p-8'>
                {loading ? (
                    <p className='text-neutral-400'>Loading videos…</p>
                ) : active ? (
                    <VideoPlayer key={active.id} src={active.url} title={active.name} />
                ) : (
                    <p className='text-neutral-400'>{videos.length ? 'Select a video tab above to play.' : 'No videos found in the folder.'}</p>
                )}
            </section>
            {showSettings && <SettingsDialog initialUrl={folderUrl} onSave={saveFolder} onClose={() => setShowSettings(false)} />}
        </main>
    );
};

export default App;
