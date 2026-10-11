/**
 * The What's Included checklist under the highlights (Sep 10 decision).
 * The list is the same on every trip except Desolation, so the shared
 * copy lives on Site Settings and the trip page passes either that or
 * the trip's own override; this component only draws what it is given.
 */
export function WhatsIncluded({ items }: { items: string[] }) {
    if (items.length === 0) return null;

    return (
        <div>
            <h2 className='font-alt-gothic text-h3 font-black uppercase leading-h3 text-holiday-red'>
                What’s Included
            </h2>
            <ul className='mt-4 space-y-2'>
                {items.map((item) => (
                    <li
                        key={item}
                        className='flex gap-3 text-body leading-body text-onyx'
                    >
                        <span aria-hidden className='text-holiday-red'>
                            ✓
                        </span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
