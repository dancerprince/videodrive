/**
 * Vite dev/preview middleware for WorkDrive folder listings.
 * For external shares, WorkDrive's own page supplies short-lived guest credentials;
 * this server extracts them for its API request and never sends them to the browser.
 */
import { parseExternalShareUrl, parseFolderUrl } from '../src/lib/workdriveFolder.js';

const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const REQUEST_TIMEOUT_MS = 15_000;

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.errors?.length) {
        const detail = body?.errors?.[0]?.title || body?.errors?.[0]?.detail;
        throw new Error(detail || `WorkDrive returned ${response.status}. Check that the share link is still accessible.`);
    }
    return body;
};

const getPageCookies = (response) => {
    const cookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [response.headers.get('set-cookie') || ''];
    return cookies.map((cookie) => cookie.split(';', 1)[0]).filter(Boolean).join('; ');
};

const getExternalShareContext = async (shareUrl) => {
    const response = await fetch(shareUrl, {
        headers: { Accept: 'text/html' },
        redirect: 'error',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`WorkDrive share page returned ${response.status}.`);
    const html = await response.text();
    const capture = (expression, label) => {
        const value = html.match(expression)?.[1];
        if (!value) throw new Error(`WorkDrive did not provide ${label}; the share may have expired or changed.`);
        return value;
    };
    const resourceId = capture(/\bresourceId\s*=\s*"([\w-]+)"/, 'a folder identifier');
    const anonymousId = capture(/\bwmsAnnonId\s*=\s*"([^"]+)"/, 'guest access credentials');
    const accessToken = capture(/\bwmsAccessToken\s*=\s*"([^"]+)"/, 'guest access credentials');

    return {
        apiUrl: new URL('/public/api/v1/', new URL(shareUrl).origin),
        headers: {
            Accept: 'application/vnd.api+json, application/json',
            Origin: new URL(shareUrl).origin,
            Referer: shareUrl,
            Cookie: getPageCookies(response),
            'x-wms-anonymous-id': anonymousId,
            'x-wms-access-token': accessToken,
            'x-wms-api-name': 'wmsapi',
            'x-wms-functionality': 'accesstoken',
            'x-wms-keypair-prd': 'default',
            'x-wms-encrypt-type': '0',
            'x-wat-expiration-in-millis': '-1',
        },
        resourceId,
    };
};

const fetchExternalListing = async (shareUrl) => {
    const context = await getExternalShareContext(shareUrl);
    const folder = await fetchJson(new URL(`files/${context.resourceId}`, context.apiUrl), { headers: context.headers });
    if (!folder?.data?.attributes?.is_folder) throw new Error('The external share link does not point to a folder.');

    const all = [];
    for (let page = 0; page < MAX_PAGES; page += 1) {
        const endpoint = new URL(`files/${context.resourceId}/files`, context.apiUrl);
        endpoint.searchParams.set('page[limit]', String(PAGE_SIZE));
        endpoint.searchParams.set('page[offset]', String(page * PAGE_SIZE));
        const json = await fetchJson(endpoint, { headers: context.headers });
        const entries = Array.isArray(json?.data) ? json.data : [];
        all.push(...entries);
        if (entries.length < PAGE_SIZE) break;
        if (page === MAX_PAGES - 1) throw new Error(`This folder has more than ${PAGE_SIZE * MAX_PAGES} items; narrow the folder and try again.`);
    }
    return all;
};

const fetchPublicListing = async ({ dc, folderId }) => {
    const all = [];
    for (let page = 0; page < MAX_PAGES; page += 1) {
        const api = `https://workdrive.zohopublic.${dc}/api/v1/files/${folderId}/files?page%5Blimit%5D=${PAGE_SIZE}&page%5Boffset%5D=${page * PAGE_SIZE}`;
        const response = await fetch(api, { headers: { Accept: 'application/vnd.api+json' }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        if (!response.ok) throw new Error(`WorkDrive responded ${response.status}. Check that the folder link is public.`);
        const json = await response.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        all.push(...data);
        if (data.length < PAGE_SIZE) break;
    }
    return { dc, data: all };
};

const handler = async (req, res) => {
    const send = (status, body) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(body));
    };

    try {
        const url = new URL(req.url, 'http://local').searchParams.get('url') || '';
        const publicFolder = parseFolderUrl(url);
        if (publicFolder) return send(200, await fetchPublicListing(publicFolder));

        if (!parseExternalShareUrl(url)) {
            return send(400, { error: 'Enter a WorkDrive folder link, such as https://workdrive.zohoexternal.in/external/<share-token>.' });
        }
        const data = await fetchExternalListing(url);
        send(200, { data });
    } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        send(timedOut ? 504 : 502, { error: timedOut ? 'WorkDrive took too long to respond. Try again.' : error.message || 'Could not read this WorkDrive share.' });
    }
};

export const workdriveFolderProxy = () => ({
    name: 'workdrive-folder-proxy',
    configureServer(server) {
        server.middlewares.use('/folder-listing', handler);
    },
    configurePreviewServer(server) {
        server.middlewares.use('/folder-listing', handler);
    },
});
