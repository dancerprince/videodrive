import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveVideoSource } from './videoSource.js';

test('direct mp4 resolves to a file source', () => {
    const r = resolveVideoSource('https://media.w3.org/2010/05/sintel/trailer.mp4');
    assert.equal(r.kind, 'file');
    assert.equal(r.uncertain, false);
});

test('webm and mov are recognised file extensions', () => {
    assert.equal(resolveVideoSource('https://x.com/a.webm').uncertain, false);
    assert.equal(resolveVideoSource('https://x.com/a.mov').uncertain, false);
});

test('extensionless CDN url is a file but flagged uncertain', () => {
    const r = resolveVideoSource('https://cdn.example.com/stream/abc123?sig=xyz');
    assert.equal(r.kind, 'file');
    assert.equal(r.uncertain, true);
});

test('youtube watch/short/youtu.be/embed all yield the same id', () => {
    const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    ];
    for (const u of urls) {
        const r = resolveVideoSource(u);
        assert.equal(r.kind, 'embed', u);
        assert.equal(r.provider, 'youtube', u);
        assert.ok(r.src.includes('/embed/dQw4w9WgXcQ'), u);
    }
});

test('youtube watch url with extra params before v= still parses', () => {
    const r = resolveVideoSource('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ');
    assert.equal(r.provider, 'youtube');
    assert.ok(r.src.includes('dQw4w9WgXcQ'));
});

test('youtube loop requires playlist param set to the same id', () => {
    const r = resolveVideoSource('https://youtu.be/dQw4w9WgXcQ');
    assert.ok(r.src.includes('loop=1'));
    assert.ok(r.src.includes('playlist=dQw4w9WgXcQ'));
});

test('vimeo resolves to background embed', () => {
    const r = resolveVideoSource('https://vimeo.com/76979871');
    assert.equal(r.kind, 'embed');
    assert.equal(r.provider, 'vimeo');
    assert.ok(r.src.includes('background=1'));
});

test('m3u8 is detected as hls with a caveat', () => {
    const r = resolveVideoSource('https://example.com/live/index.m3u8');
    assert.equal(r.kind, 'hls');
    assert.ok(r.reason.includes('Safari'));
});

test('empty input is none, not an error', () => {
    assert.equal(resolveVideoSource('').kind, 'none');
    assert.equal(resolveVideoSource('   ').kind, 'none');
    assert.equal(resolveVideoSource(undefined).kind, 'none');
});

test('malformed and non-http urls are rejected', () => {
    assert.equal(resolveVideoSource('not a url').kind, 'error');
    assert.equal(resolveVideoSource('javascript:alert(1)').kind, 'error');
    assert.equal(resolveVideoSource('data:video/mp4;base64,AAAA').kind, 'error');
});

test('uppercase extensions are handled', () => {
    assert.equal(resolveVideoSource('https://x.com/CLIP.MP4').uncertain, false);
});
