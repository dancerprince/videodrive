import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseExternalShareListing, parseExternalShareUrl, parseFolderUrl, parseFolderListing } from './workdriveFolder.js';

const externalUrl = 'https://workdrive.zohoexternal.in/external/test-share-token';

test('parseFolderUrl accepts public folder links only', () => {
    assert.deepEqual(parseFolderUrl('https://workdrive.zohopublic.in/folder/abc123'), { dc: 'in', folderId: 'abc123' });
    assert.equal(parseFolderUrl('https://workdrive.zohopublic.in/file/abc123'), null);
    assert.equal(parseFolderUrl('https://evil.com/folder/abc'), null);
    assert.equal(parseFolderUrl('nope'), null);
});

test('parseExternalShareUrl accepts WorkDrive external folder share links only', () => {
    assert.deepEqual(parseExternalShareUrl(externalUrl), {
        dc: 'in', shareToken: 'test-share-token',
    });
    assert.equal(parseExternalShareUrl('http://workdrive.zohoexternal.in/external/token'), null);
    assert.equal(parseExternalShareUrl('https://evil.test/external/token'), null);
    assert.equal(parseExternalShareUrl('https://workdrive.zohoexternal.in/file/token'), null);
});

test('parseFolderListing keeps sorted public video files and builds download urls', () => {
    const json = {
        data: [
            { id: 'b', attributes: { name: 'Video 10.mp4' } },
            { id: 'a', attributes: { name: 'Video 2.MOV' } },
            { id: 'c', attributes: { name: 'notes.pdf' } },
            { id: 'd', attributes: { name: 'Sub.mp4', is_folder: true } },
        ],
    };
    const out = parseFolderListing(json, 'in');
    assert.deepEqual(out.map((v) => v.name), ['Video 2.MOV', 'Video 10.mp4']);
    assert.equal(out[0].url, 'https://download.zoho.in/public/workdrive-public/download/a');
    assert.deepEqual(parseFolderListing(null, 'in'), []);
});

test('parseExternalShareListing uses WorkDrive direct-download URLs and skips unsafe entries', () => {
    const json = {
        data: [
            { id: 'z', attributes: { name: 'Take 10.webm', download_url: 'https://files-accl.zohoexternal.in/public/workdrive-external/download/z' } },
            { id: 'a', attributes: { display_attr_name: 'Take 2.mov', download_url: 'https://files.zohoexternal.in/public/workdrive-external/download/a' } },
            { id: 'p', attributes: { name: 'notes.pdf', download_url: 'https://files.zohoexternal.in/download/p' } },
            { id: 'f', attributes: { name: 'folder.mp4', is_folder: true, download_url: 'https://files.zohoexternal.in/download/f' } },
            { id: 'x', attributes: { name: 'unsafe.mp4', download_url: 'https://evil.test/unsafe.mp4' } },
        ],
    };
    assert.deepEqual(parseExternalShareListing(json), [
        { id: 'a', name: 'Take 2.mov', url: 'https://files.zohoexternal.in/public/workdrive-external/download/a' },
        { id: 'z', name: 'Take 10.webm', url: 'https://files-accl.zohoexternal.in/public/workdrive-external/download/z' },
    ]);
    assert.deepEqual(parseExternalShareListing(null), []);
});
