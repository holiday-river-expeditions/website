/**
 * Turns the URL an editor pastes from the address bar into the embeddable
 * one. Editors copy watch links, not embed links, so accepting only the
 * latter would mean a silently blank player on the trip page.
 *
 * Anything unrecognised is returned unchanged — the iframe then fails
 * visibly rather than us guessing at a rewrite.
 */
export function embedUrl(url: string): string {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return url;
    }

    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
        const id = parsed.pathname.slice(1);
        return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (parsed.pathname === '/watch') {
            const id = parsed.searchParams.get('v');
            return id ? `https://www.youtube.com/embed/${id}` : url;
        }
        // Already an /embed/ or /shorts/ style link.
        const shorts = parsed.pathname.match(/^\/shorts\/([^/]+)/);
        if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
        return url;
    }

    if (host === 'vimeo.com') {
        const id = parsed.pathname.split('/').filter(Boolean)[0];
        return /^\d+$/.test(id ?? '')
            ? `https://player.vimeo.com/video/${id}`
            : url;
    }

    return url;
}
