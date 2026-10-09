import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPlayableUrl, isWorkDriveUrl } from './workdriveUrl.js';
import { normaliseCatalog } from '../services/videoCatalog.js';

test('zohopublic file link becomes a download link (dc preserved)', () => {
    assert.equal(
        toPlayableUrl('https://workdrive.zohopublic.eu/file/abc123'),
        'https://download.zoho.eu/public/workdrive-public/download/abc123',
    );
    assert.equal(
        toPlayableUrl('https://workdrive.zohopublic.com/file/xyz/'),
        'https://download.zoho.com/public/workdrive-public/download/xyz',
    );
});

test('zohoexternal link gets /download appended', () => {
    assert.equal(
        toPlayableUrl('https://workdrive.zohoexternal.in/external/tok123'),
        'https://workdrive.zohoexternal.in/external/tok123/download',
    );
});

test('non-WorkDrive and invalid urls pass through', () => {
    assert.equal(toPlayableUrl('https://media.w3.org/a.mp4'), 'https://media.w3.org/a.mp4');
    assert.equal(toPlayableUrl('nope'), 'nope');
    assert.equal(isWorkDriveUrl('https://workdrive.zohopublic.eu/file/a'), true);
    assert.equal(isWorkDriveUrl('https://example.com'), false);
});

test('catalog normalises entries and drops bad/unplayable ones', () => {
    const out = normaliseCatalog({
        videos: [
            { name: 'A', url: 'https://workdrive.zohopublic.eu/file/a1' },
            { url: 'https://x.com/b.mp4' },
            { name: 'bad', url: 'javascript:alert(1)' },
            { name: 'yt', url: 'https://youtu.be/dQw4w9WgXcQ' },
            { name: 'empty' },
        ],
    });
    assert.equal(out.length, 2);
    assert.equal(out[0].url, 'https://download.zoho.eu/public/workdrive-public/download/a1');
    assert.equal(out[1].name, 'Video 2');
});

test('catalog rejects a malformed file', () => {
    assert.throws(() => normaliseCatalog({ nope: 1 }));
});
