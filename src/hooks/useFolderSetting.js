import { useCallback, useState } from 'react';

const KEY = 'workdrive.folderUrl';

const read = () => {
    try {
        return localStorage.getItem(KEY) || '';
    } catch {
        return '';
    }
};

/** Persists the WorkDrive public folder URL in localStorage. */
export const useFolderSetting = () => {
    const [folderUrl, setFolderUrl] = useState(read);
    const save = useCallback((value) => {
        const v = (value || '').trim();
        try {
            if (v) localStorage.setItem(KEY, v);
            else localStorage.removeItem(KEY);
        } catch { /* storage unavailable — keep in memory only */ }
        setFolderUrl(v);
    }, []);
    return [folderUrl, save];
};
