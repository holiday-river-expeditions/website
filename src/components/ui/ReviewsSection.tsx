import Image from 'next/image';
import { Carousel } from '@/components/ui/Carousel';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';

export interface GuestReview {
    quote: string;
    author?: string | null;
    source?: string | null;
}

/**
 * "What Guests Say" — the reviews widget from the Aug 20 sync: a carousel
 * of guest quotes plus links out to the review platforms. Reviews live on
 * TripAdvisor and Google per the reviews strategy; the quotes here are
 * the ones Holiday curates onto the trip in the Studio, and the links are
 * where the rest are. Renders nothing when there is neither.
 */
export function ReviewsSection({
    reviews,
    ratingLabel,
    tripadvisorUrl,
    googleUrl,
}: {
    reviews: GuestReview[];
    ratingLabel?: string | null;
    tripadvisorUrl?: string | null;
    googleUrl?: string | null;
}) {
    const hasLinks = Boolean(tripadvisorUrl || googleUrl);
    if (reviews.length === 0 && !hasLinks) return null;

    const linkStyle =
        'font-alt-gothic text-[15px] font-semibold uppercase tracking-[0.05em] text-onyx underline decoration-holiday-red decoration-2 underline-offset-4 transition-opacity hover:opacity-70';

    // No quotes yet: a compact rating + links strip, with no heading
    // promising quotes the page doesn't have.
    const hasReviews = reviews.length > 0;

    return (
        <Section
            id='reviews'
            background='sand'
            className={`scroll-mt-6 [[data-demo-sticky-header=on]_&]:scroll-mt-28 ${
                hasReviews ? 'py-16 md:py-20' : 'py-10 md:py-12'
            }`}
        >
            {hasReviews && (
                <h2
                    data-reveal
                    className='text-center font-alt-gothic text-section font-black uppercase text-holiday-red'
                >
                    What Guests Say
                </h2>
            )}

            {hasReviews && (
                <Carousel
                    label='Guest reviews'
                    className='mt-8'
                    slides={reviews.map((review, i) => (
                        <figure
                            key={i}
                            className='mx-auto max-w-3xl px-2 text-center'
                        >
                            <span
                                aria-hidden
                                className='font-alt-gothic text-[80px] font-black leading-[0.5] text-holiday-red'
                            >
                                &ldquo;
                            </span>
                            <blockquote className='mt-2 font-alt-gothic text-h3 font-semibold uppercase leading-[1.15] text-onyx md:text-[32px]'>
                                {review.quote}
                            </blockquote>
                            {(review.author || review.source) && (
                                <figcaption className='mt-5 text-body font-bold uppercase tracking-wider text-onyx'>
                                    {review.author}
                                    {review.author && review.source && ' · '}
                                    {review.source && (
                                        <span>via {review.source}</span>
                                    )}
                                </figcaption>
                            )}
                        </figure>
                    ))}
                />
            )}

            {/* Rating + the platforms that hold the rest of the reviews. */}
            {(ratingLabel || hasLinks) && (
                <div
                    data-reveal
                    className={`flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center ${
                        hasReviews ? 'mt-10 border-t border-onyx/15 pt-8' : ''
                    }`}
                >
                    {ratingLabel && (
                        <div className='flex items-center gap-3'>
                            <span
                                aria-hidden
                                className='text-[20px] leading-none text-holiday-red'
                            >
                                ★★★★★
                            </span>
                            <span className='font-alt-gothic text-[19px] font-semibold uppercase tracking-[0.03em] text-onyx'>
                                {ratingLabel}
                            </span>
                        </div>
                    )}
                    {hasLinks && (
                        <div className='flex items-center gap-6'>
                            {tripadvisorUrl && (
                                <ExternalLink
                                    href={tripadvisorUrl}
                                    className={linkStyle}
                                >
                                    Read more on TripAdvisor
                                </ExternalLink>
                            )}
                            {googleUrl && (
                                <ExternalLink
                                    href={googleUrl}
                                    className={linkStyle}
                                >
                                    Google Reviews
                                </ExternalLink>
                            )}
                        </div>
                    )}
                    <Image
                        src='/nps-authorized-concessioner.png'
                        alt='National Park Service Authorized Concessioner'
                        width={80}
                        height={100}
                        className='h-14 w-auto'
                    />
                </div>
            )}
        </Section>
    );
}
