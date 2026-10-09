import { toPlayableUrl } from '../lib/workdriveUrl.js';
import { resolveVideoSource } from '../lib/videoSource.js';
import { parseExternalShareListing, parseExternalShareUrl, parseFolderListing, parseFolderUrl } from '../lib/workdriveFolder.js';

/** Static fallback catalog (`public/videos.json`). */
export const CATALOG_URL = `${import.meta.env?.BASE_URL ?? '/'}videos.json`;

/** Validates + normalises raw catalog entries. Pure — unit tested. */
export const normaliseCatalog = (data) => {
    const list = Array.isArray(data) ? data : data?.videos;
    if (!Array.isArray(list)) throw new Error('videos.json must contain a "videos" array.');

    return list
        .filter((video) => video && typeof video.url === 'string' && video.url.trim())
        .map((video, index) => {
            const url = toPlayableUrl(video.url);
            const source = resolveVideoSource(url);
            return {
                id: String(video.id ?? index),
                name: String(video.name || `Video ${index + 1}`),
                url,
                kind: source.kind,
            };
        })
        .filter((video) => video.kind === 'file' || video.kind === 'hls');
};

/** Loads the public folder listing through the same-origin server proxy. */
export const fetchFolderCatalog = async (folderUrl) => {
    const isPublic = parseFolderUrl(folderUrl);
    const isExternal = parseExternalShareUrl(folderUrl);
    if (!isPublic && !isExternal) throw new Error('Enter a valid WorkDrive folder link.');

    const baseUrl = import.meta.env?.BASE_URL ?? '/';
    const response = await fetch(`${baseUrl}folder-listing?url=${encodeURIComponent(folderUrl)}`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Folder request failed (${response.status})`);

    const videos = isExternal
        ? parseExternalShareListing(body)
        : parseFolderListing(body, body.dc);
    return normaliseCatalog(videos);
};

export const fetchCatalog = async () => {
    const response = await fetch(CATALOG_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load videos.json (${response.status})`);
    return normaliseCatalog(await response.json());
};
