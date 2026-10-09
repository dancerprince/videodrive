import { toPlayableUrl } from './workdriveUrl.js';

export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogg', 'ogv', 'mkv', 'm3u8'];

/** Parses the older public-folder URL format. */
export const parseFolderUrl = (rawUrl) => {
    let parsed;
    try {
        parsed = new URL((rawUrl || '').trim());
    } catch {
        return null;
    }
    const host = parsed.hostname.match(/^workdrive\.zohopublic\.([a-z.]+)$/i);
    const id = parsed.pathname.match(/^\/folder\/([\w-]+)\/?$/);
    return host && id ? { dc: host[1].toLowerCase(), folderId: id[1] } : null;
};

/** Parses WorkDrive external-share folder links (no OAuth sign-in required). */
export const parseExternalShareUrl = (rawUrl) => {
    let parsed;
    try {
        parsed = new URL((rawUrl || '').trim());
    } catch {
        return null;
    }
    const host = parsed.hostname.match(/^workdrive\.zohoexternal\.([a-z.]+)$/i);
    const token = parsed.pathname.match(/^\/external\/([\w-]+)\/?$/);
    return parsed.protocol === 'https:' && host && token
        ? { dc: host[1].toLowerCase(), shareToken: token[1] }
        : null;
};

const extensionOf = (name) => (name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });

/** Converts a public WorkDrive JSON:API folder listing to playable video catalog entries. */
export const parseFolderListing = (json, dc) => {
    const items = Array.isArray(json?.data) ? json.data : [];
    return items
        .map((item) => {
            const a = item?.attributes || {};
            return { id: String(item?.id || ''), name: String(a.name || a.display_attr_name || ''), isFolder: a.is_folder === true || a.type === 'folder' };
        })
        .filter((f) => f.id && f.name && !f.isFolder && VIDEO_EXTENSIONS.includes(extensionOf(f.name)))
        .sort(naturalSort)
        .map((f) => ({ id: f.id, name: f.name, url: toPlayableUrl(`https://workdrive.zohopublic.${dc}/file/${f.id}`) }));
};

/** Converts external-share JSON:API results to catalog entries using WorkDrive's direct media URL. */
export const parseExternalShareListing = (json) => {
    const items = Array.isArray(json?.data) ? json.data : [];
    return items
        .map((item) => {
            const attributes = item?.attributes || {};
            return {
                id: String(item?.id || ''),
                name: String(attributes.name || attributes.display_attr_name || ''),
                isFolder: attributes.is_folder === true || attributes.type === 'folder',
                url: attributes.download_url,
            };
        })
        .filter((item) => {
            if (!item.id || !item.name || item.isFolder || !VIDEO_EXTENSIONS.includes(extensionOf(item.name))) return false;
            try {
                const url = new URL(item.url);
                return url.protocol === 'https:' && /^(?:[a-z0-9-]+\.)*zohoexternal\.[a-z.]+$/i.test(url.hostname);
            } catch {
                return false;
            }
        })
        .sort(naturalSort)
        .map(({ id, name, url }) => ({ id, name, url }));
};
