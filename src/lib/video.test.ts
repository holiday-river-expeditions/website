import { describe, expect, it } from 'vitest';
import { embedUrl } from './video';

describe('embedUrl', () => {
    it('rewrites a YouTube watch link', () => {
        expect(embedUrl('https://www.youtube.com/watch?v=abc123')).toBe(
            'https://www.youtube.com/embed/abc123',
        );
    });

    it('keeps other query params out of the embed link', () => {
        expect(
            embedUrl('https://youtube.com/watch?v=abc123&t=42&list=PL1'),
        ).toBe('https://www.youtube.com/embed/abc123');
    });

    it('rewrites a youtu.be short link', () => {
        expect(embedUrl('https://youtu.be/abc123')).toBe(
            'https://www.youtube.com/embed/abc123',
        );
    });

    it('rewrites a YouTube Shorts link', () => {
        expect(embedUrl('https://www.youtube.com/shorts/abc123')).toBe(
            'https://www.youtube.com/embed/abc123',
        );
    });

    it('rewrites a Vimeo link', () => {
        expect(embedUrl('https://vimeo.com/123456789')).toBe(
            'https://player.vimeo.com/video/123456789',
        );
    });

    it('leaves an already-embeddable YouTube link alone', () => {
        const url = 'https://www.youtube.com/embed/abc123';
        expect(embedUrl(url)).toBe(url);
    });

    it('leaves a Vimeo vanity URL alone rather than guessing', () => {
        const url = 'https://vimeo.com/holidayriver/westwater';
        expect(embedUrl(url)).toBe(url);
    });

    it('returns unparseable input unchanged', () => {
        expect(embedUrl('not a url')).toBe('not a url');
    });
});
