'use client';

import { useEffect, useRef, useState } from 'react';
import { useDemoFlag } from '@/lib/use-demo-flag';

/**
 * Draft hero video behind the `hero-video` demo flag: a 14 second muted
 * loop of five steady shots. An aerial of the Desolation gorge from the
 * flight in, the big Westwater rapid from a locked-off camera, Holiday
 * rafts coming through that same frame, a camp fajita spread, and the view
 * past the plane's wing, which cuts back into the gorge at the loop point.
 * Nothing renders until the flag is on, so real visitors never download
 * the file. Reduced-motion visitors get the poster frame and can start it
 * with the button. The pause button is there because autoplaying motion
 * longer than five seconds needs one (WCAG 2.2.2).
 */
export function HeroVideo() {
    const on = useDemoFlag('hero-video');
    const ref = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        const video = ref.current;
        if (!on || !video) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        video.play().catch(() => setPlaying(false));
    }, [on]);

    if (!on) return null;

    const toggle = () => {
        const video = ref.current;
        if (!video) return;
        if (video.paused) void video.play();
        else video.pause();
    };

    return (
        <>
            <div className='absolute inset-0'>
                <video
                    ref={ref}
                    src='/hero/westwater-loop.mp4'
                    poster='/hero/westwater-loop.jpg'
                    muted
                    loop
                    playsInline
                    preload='auto'
                    aria-hidden
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    className='h-full w-full object-cover'
                />
                {/* Lighter centre-weighted shade than the branded photos.
                    The full one flattened the graded color, and the text
                    shadow already keeps the contact line readable where a
                    white raft tube passes under it. */}
                <div className='absolute inset-0 bg-radial from-onyx/35 to-transparent' />
            </div>
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
