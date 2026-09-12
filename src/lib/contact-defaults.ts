/**
 * Hard fallbacks for the Site Settings document. Every page reads the
 * phone and email from Sanity first; these only show when the Studio
 * fields are empty. The address is the one Lauren named at the Sep 3
 * sync for the new domain.
 */
export const DEFAULT_PHONE = '801-266-2087';
export const DEFAULT_EMAIL = 'info@holidayriver.com';

interface ContactSettings {
    phone?: string | null;
    email?: string | null;
}

/** A blank or whitespace-only Studio value counts as unset. */
export function contactPhone(settings: ContactSettings | null | undefined) {
    return settings?.phone?.trim() || DEFAULT_PHONE;
}

export function contactEmail(settings: ContactSettings | null | undefined) {
    return settings?.email?.trim() || DEFAULT_EMAIL;
}
