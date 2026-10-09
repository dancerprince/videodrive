import { useEffect, useState } from 'react';
import { fetchCatalog, fetchFolderCatalog } from '../services/videoCatalog.js';

/**
 * Loads the catalog. With a folder URL it lists that WorkDrive folder,
 * otherwise falls back to public/videos.json. Returns { videos, loading, error }.
 */
export const useVideoCatalog = (folderUrl) => {
    const [result, setResult] = useState({ key: null, videos: [], error: '' });

    useEffect(() => {
        let alive = true;
        (folderUrl ? fetchFolderCatalog(folderUrl) : fetchCatalog())
            .then((videos) => alive && setResult({ key: folderUrl, videos, error: '' }))
            .catch((e) => alive && setResult({ key: folderUrl, videos: [], error: e.message }));
        return () => { alive = false; };
    }, [folderUrl]);

    const loading = result.key !== folderUrl;
    return { videos: loading ? [] : result.videos, loading, error: loading ? '' : result.error };
};
