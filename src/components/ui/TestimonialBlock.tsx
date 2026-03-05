interface Testimonial {
    quote: string;
    author: string;
    trip: string;
    rating: number;
}

interface TestimonialBlockProps {
    testimonials: Testimonial[];
}

function Stars({ count }: { count: number }) {
    return (
        <div
            className='flex gap-1 text-teal'
            aria-label={`${count} out of 5 stars`}
        >
            {Array.from({ length: 5 }, (_, i) => (
                <svg
                    key={i}
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill={i < count ? 'currentColor' : 'none'}
                    stroke='currentColor'
                    strokeWidth='1.5'
                >
                    <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                </svg>
            ))}
        </div>
    );
}

export function TestimonialBlock({ testimonials }: TestimonialBlockProps) {
    return (
        <div className='mx-auto grid max-w-5xl gap-12 md:grid-cols-2'>
            {testimonials.map((t) => (
                <blockquote key={t.author} className='flex flex-col gap-4'>
                    <Stars count={t.rating} />
                    <p className='text-subheading italic leading-subheading text-white/90'>
                        &ldquo;{t.quote}&rdquo;
                    </p>
                    <footer className='text-body leading-body text-light-gray'>
                        <span className='font-semibold text-white'>
                            {t.author}
                        </span>
                        <span className='mx-2 text-teal'>&mdash;</span>
                        <span>{t.trip}</span>
                    </footer>
                </blockquote>
            ))}
        </div>
    );
}
