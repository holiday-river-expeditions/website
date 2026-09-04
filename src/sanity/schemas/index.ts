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
import {
    tripFinderCondition,
    tripFinderOption,
    tripFinderQuestion,
    tripFinderSpec,
} from './trip-finder-spec';
import { tripInfoSection } from './trip-info-section';
import { tripType } from './trip-type';

export const schemaTypes = [
    // Taxonomy documents
    river,
    tripType,
    specialtyType,

    // Core documents
    trip,
    tripInfoSection,
    faq,
    page,
    post,

    // Form captures (created by API routes, triaged in the Studio)
    contactSubmission,
    newsletterSubscriber,

    // Singletons
    homepage,
    siteSettings,
    tripFinderSpec,

    // Object types (content blocks)
    heroBlock,
    contentBlock,
    tripFinderQuestion,
    tripFinderOption,
    tripFinderCondition,
];
