import { activity } from './activity';
import { contentBlock } from './blocks/content-block';
import { heroBlock } from './blocks/hero-block';
import { contactSubmission } from './contact-submission';
import { newsletterSubscriber } from './newsletter-subscriber';
import { faq } from './faq';
import { homepage } from './homepage';
import { page } from './page';
import { post } from './post';
import { river } from './river';
import { siteSettings } from './site-settings';
import { specialtyType } from './specialty-type';
import { trip } from './trip';
import { tripCategory } from './trip-category';

export const schemaTypes = [
    // Taxonomy documents
    river,
    activity,
    tripCategory,
    specialtyType,

    // Core documents
    trip,
    faq,
    page,
    post,

    // Form captures (created by API routes, triaged in the Studio)
    contactSubmission,
    newsletterSubscriber,

    // Singletons
    homepage,
    siteSettings,

    // Object types (content blocks)
    heroBlock,
    contentBlock,
];
