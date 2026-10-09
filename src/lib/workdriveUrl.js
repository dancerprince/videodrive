/**
 * Turns a Zoho WorkDrive *public share* link into a URL a <video> tag can stream.
 *
 * WorkDrive share links open an HTML preview page, not the media file, so they
 * must be rewritten to the matching download endpoint. No API / OAuth involved.
 *
 *   https://workdrive.zohopublic.<dc>/file/<id>
 *     -> https://download.zoho.<dc>/public/workdrive-public/download/<id>
 *
 *   https://workdrive.zohoexternal.<dc>/external/<token>
 *     -> https://workdrive.zohoexternal.<dc>/external/<token>/download
 *
 * Anything else (already a download link, a CDN url, a sample clip) is returned unchanged.
 * NOTE: the exact download format should be confirmed against a real link once one is available.
 */
export const toPlayableUrl = (rawUrl) => {
    const url = (rawUrl || '').trim();
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return url;
    }

    const publicHost = parsed.hostname.match(/^workdrive\.zohopublic\.([a-z.]+)$/i);
    const fileId = parsed.pathname.match(/^\/file\/([\w-]+)\/?$/);
    if (publicHost && fileId) {
        return `https://download.zoho.${publicHost[1]}/public/workdrive-public/download/${fileId[1]}`;
    }

    const external = /^workdrive\.zohoexternal\.[a-z.]+$/i.test(parsed.hostname);
    const token = parsed.pathname.match(/^\/external\/([\w-]+)\/?$/);
    if (external && token) {
        return `${parsed.origin}/external/${token[1]}/download`;
    }

    return url;
};

/** True for any WorkDrive public/external host. */
export const isWorkDriveUrl = (rawUrl) => /^https?:\/\/workdrive\.zoho(public|external)\./i.test((rawUrl || '').trim());
