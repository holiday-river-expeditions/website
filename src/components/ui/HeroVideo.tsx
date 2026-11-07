'use client';

import { useEffect, useRef, useState } from 'react';

type Mode =
    // Before hydration, or the browser can't play MP4: the photo only.
    | 'photo'
    // Reduced motion or Data Saver: the photo, with a button to opt in.
    | 'offer'
    // Load and loop the video over the photo.
    | 'play';

/** Data Saver or a 2G connection. Chrome-family only; elsewhere this is
    undefined and the video plays. */
function onSlowOrSavingData(): boolean {
    const connection = (
        navigator as Navigator & {
            connection?: { saveData?: boolean; effectiveType?: string };
        }
    ).connection;
    if (!connection) return false;
    return (
        connection.saveData === true ||
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g'
    );
}

/**
 * The homepage hero video (default since 2026-11-06; it was the hero-video
 * demo flag). A 14 second muted loop of five steady shots: an aerial of
 * the Desolation gorge from the flight in, the big Westwater rapid from a
 * locked-off camera, Holiday rafts coming through that same frame, a camp
 * fajita spread, and the view past the plane's wing, which cuts back into
 * the gorge at the loop point.
 *
 * It sits over the Studio photo, which is the fallback and the first
 * paint. The video only mounts after hydration, so the photo stays the
 * page's largest paint, and it fades in once it is actually playing.
 * Visitors who prefer reduced motion, or have Data Saver on, keep the
 * photo and get a play button instead. The pause button is there because
 * autoplaying motion longer than five seconds needs one (WCAG 2.2.2).
 */
export function HeroVideo() {
    const ref = useRef<HTMLVideoElement>(null);
    const [mode, setMode] = useState<Mode>('photo');
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        const probe = document.createElement('video');
        if (!probe.canPlayType('video/mp4')) return;
        const reduce = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        // Settled once on mount: the video is the default, and these are
        // the cases where it waits to be asked for.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode(reduce || onSlowOrSavingData() ? 'offer' : 'play');
    }, []);

    useEffect(() => {
        if (mode !== 'play') return;
        ref.current?.play().catch(() => setPlaying(false));
    }, [mode]);

    if (mode === 'photo') return null;

    const toggle = () => {
        if (mode === 'offer') {
            setMode('play');
            return;
        }
        const video = ref.current;
        if (!video) return;
        if (video.paused) void video.play();
        else video.pause();
    };

    return (
        <>
            {mode === 'play' && (
                <div
                    className={`absolute inset-0 transition-opacity duration-700 ${
                        playing ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <video
                        ref={ref}
                        src='/hero/westwater-loop.mp4'
                        muted
                        loop
                        playsInline
                        preload='auto'
                        aria-hidden
                        onPlaying={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        className='h-full w-full object-cover'
                    />
                    {/* Lighter centre-weighted shade than a full overlay.
                        That flattened the graded color, and the headline's
                        text shadow keeps the contact line readable where a
                        white raft tube passes under it. */}
                    <div className='absolute inset-0 bg-radial from-onyx/35 to-transparent' />
                </div>
            )}
            <button
                type='button'
                onClick={toggle}
                aria-label={
                    playing ? 'Pause background video' : 'Play background video'
                }
                className='absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-onyx/60 text-holiday-white transition-colors hover:bg-onyx/80 md:bottom-6 md:right-6'
            >
                {playing ? (
                    <svg viewBox='0 0 16 16' className='h-4 w-4' aria-hidden>
                        <rect
                            x='3'
                            y='2'
                            width='3.5'
                            height='12'
                            fill='currentColor'
                        />
                        <rect
                            x='9.5'
                            y='2'
                            width='3.5'
                            height='12'
                            fill='currentColor'
                        />
                    </svg>
                ) : (
                    <svg viewBox='0 0 16 16' className='h-4 w-4' aria-hidden>
                        <path d='M4 2.5v11l9.5-5.5z' fill='currentColor' />
                    </svg>
                )}
            </button>
        </>
    );
}
