import { activity } from './activity';
import { contentBlock } from './blocks/content-block';
import { heroBlock } from './blocks/hero-block';
import { faq } from './faq';
import { page } from './page';
import { river } from './river';
import { siteSettings } from './site-settings';
import { trip } from './trip';
import { tripCategory } from './trip-category';

export const schemaTypes = [
  // Taxonomy documents
  river,
  activity,
  tripCategory,

  // Core documents
  trip,
  faq,
  siteSettings,
  page,

  // Object types (content blocks)
  heroBlock,
  contentBlock,
];
