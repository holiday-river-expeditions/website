'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Silent decorative loop, layered over the still that the parent renders
 * beneath it. Honors the site's motion contract (globals.css L42-45):
 *
 *  1. The server never emits `autoPlay` — a static JSX attribute can't be
 *     revoked by `prefers-reduced-motion`, so playback is a JS decision.
 *     Combined with `preload='none'`, a reduced-motion or no-JS visitor
 *     fetches zero video bytes; the still underneath is the whole experience.
 *  2. Playback runs only while the panel is actually on screen.
 *  3. A visible pause control satisfies WCAG 2.2.2 (auto-starting motion
 *     past five seconds must be pausable). It sits outside the aria-hidden
 *     video so it stays reachable.
 */
export function AmbientVideo({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    // Assume reduced motion until the media query says otherwise, so the first
    // client render after hydration never starts playback on its own.
    const [reduceMotion, setReduceMotion] = useState(true);
    const [inView, setInView] = useState(false);
    const [userPaused, setUserPaused] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);

    // Track the preference live — flipping it mid-session must stop the loop.
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduceMotion(query.matches);
        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let observerFired = false;
        let observer: IntersectionObserver | undefined;
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(
                (entries) => {
                    observerFired = true;
                    for (const entry of entries)
                        setInView(entry.isIntersecting);
                },
                { threshold: 0.2 },
            );
            observer.observe(video);
        }

        // Dead-observer failsafe, mirroring RevealObserver: some embedded
        // webviews support IntersectionObserver but never deliver callbacks,
        // which would leave the loop permanently unstarted. A one-shot
        // geometry check covers that and the no-support case alike, while
        // keeping the bandwidth gate honest for panels genuinely off screen.
        // Healthy browsers fire within a frame, so this never runs for them.
        const failsafe = setTimeout(() => {
            if (observerFired) return;
            const box = video.getBoundingClientRect();
            setInView(box.top < window.innerHeight && box.bottom > 0);
        }, 3000);

        return () => {
            clearTimeout(failsafe);
            observer?.disconnect();
        };
    }, []);

    const shouldLoad = inView && !reduceMotion;
    const shouldPlay = shouldLoad && !userPaused;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (!shouldPlay) {
            if (!video.paused) video.pause();
            return;
        }
        // React omits `muted` from SSR'd markup, and an unmuted video is
        // refused autoplay — set the property directly before asking to play.
        video.muted = true;
        // Rejects under iOS Low Power Mode and strict autoplay policies; the
        // still simply stays put, which is an acceptable resting state.
        void video.play().catch(() => {});
    }, [shouldPlay]);

    return (
        <>
            <video
                ref={videoRef}
                src={shouldLoad ? src : undefined}
                muted
                loop
                playsInline
                preload='none'
                aria-hidden
                tabIndex={-1}
                disablePictureInPicture
                disableRemotePlayback
                onPlaying={() => {
                    setIsPlaying(true);
                    setHasPlayed(true);
                }}
                onPause={() => setIsPlaying(false)}
                // Driven by the real media event rather than optimistic state,
                // so a rejected play() leaves the still visible.
                className={`absolute inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-700 ${
                    isPlaying ? 'opacity-100' : 'opacity-0'
                }`}
            />
            {hasPlayed && !reduceMotion && (
                <button
                    type='button'
                    onClick={() => setUserPaused((paused) => !paused)}
                    aria-label={
                        userPaused
                            ? 'Play background video'
                            : 'Pause background video'
                    }
                    className='absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-onyx/60 text-holiday-white transition-colors hover:bg-onyx/80'
                >
                    <svg
                        viewBox='0 0 12 14'
                        width='12'
                        height='14'
                        fill='currentColor'
                        aria-hidden
                    >
                        {userPaused ? (
                            <path d='M0 0v14l12-7z' />
                        ) : (
                            <>
                                <rect width='4' height='14' />
                                <rect x='8' width='4' height='14' />
                            </>
                        )}
                    </svg>
                </button>
            )}
        </>
    );
}
