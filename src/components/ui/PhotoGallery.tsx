import Image from 'next/image';
import { Carousel } from '@/components/ui/Carousel';
import { Section } from '@/components/ui/Section';

export interface GalleryPhoto {
    key: string;
    src: string;
    alt: string;
    caption?: string | null;
}

/**
 * Trip-page photo slideshow (Justin's build-out doc lists a slideshow
 * under Trip Details). Slides are wide-crop photos with the editor's
 * caption beneath; the neighbour peeks in from the right so the strip
 * reads as scrollable without a hint.
 */
export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
    if (photos.length === 0) return null;

    return (
        <Section background='white' className='pb-16 pt-12 md:pb-20 md:pt-16'>
            <Carousel
                label='Trip photos'
                slideClassName='w-[88%] sm:w-[72%] lg:w-[60%]'
                slides={photos.map((photo) => (
                    <figure key={photo.key}>
                        <div className='relative aspect-[3/2] overflow-hidden bg-holiday-grey/15'>
                            <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                className='object-cover'
                                sizes='(max-width: 640px) 88vw, (max-width: 1024px) 72vw, 60vw'
                            />
                        </div>
                        {photo.caption && (
                            <figcaption className='mt-3 text-[14px] leading-snug text-onyx/85'>
                                {photo.caption}
                            </figcaption>
                        )}
                    </figure>
                ))}
            />
        </Section>
    );
}
