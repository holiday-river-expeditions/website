/**
 * Footer link data, shared by the site Footer and the Arctic checkout
 * template (src/app/arctic-template) so the two stay in step.
 */

// Fallbacks if the Site Settings singleton hasn't been seeded/edited yet.
// Phone and email live in lib/contact-defaults so every page agrees.
export const footerDefaults = {
    address: '544 East 3900 South\nSalt Lake City, Utah 84107',
    socialLinks: {
        instagram: 'https://www.instagram.com/holidayriverexpeditions',
        facebook: 'https://www.facebook.com/HolidayRiverExpeditions',
        youtube: 'https://www.youtube.com/@holidayriverexpeditions',
    },
};

export const resourceLinks = [
    { label: 'Trip Dates', href: '/book' },
    { label: 'F.A.Q.', href: '/faq' },
    { label: 'Trip Insurance', href: '/trip-insurance' },
    {
        label: 'Online Store',
        href: 'https://holiday-river-expeditions.square.site/',
        external: true,
    },
] as const;

interface SocialLinks {
    instagram?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    tiktok?: string | null;
}

/** Studio values win over the defaults. TikTok only shows once it's set. */
export function followLinks(socialLinks: SocialLinks | null | undefined) {
    const social = { ...footerDefaults.socialLinks, ...socialLinks };
    return [
        { label: 'Instagram', href: social.instagram },
        { label: 'Facebook', href: social.facebook },
        { label: 'YouTube', href: social.youtube },
        ...(social.tiktok ? [{ label: 'TikTok', href: social.tiktok }] : []),
    ].filter((link): link is { label: string; href: string } =>
        Boolean(link.href),
    );
}
