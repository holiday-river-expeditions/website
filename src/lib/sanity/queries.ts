import { defineQuery } from 'next-sanity';

export const allTripsQuery = defineQuery(`
  *[_type == "trip"] | order(name asc) {
    _id,
    name,
    slug,
    difficulty,
    duration,
    pricingNotes,
    arcticTripId,
    "river": river->{ name, slug },
    "activities": activities[]->{ name, slug },
    "categories": categories[]->{ name, slug },
    "mainImage": photos[0]
  }
`);

export const tripBySlugQuery = defineQuery(`
  *[_type == "trip" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    difficulty,
    duration,
    description,
    highlights,
    photos,
    pricingNotes,
    arcticTripId,
    "river": river->{ _id, name, slug, description, image },
    "activities": activities[]->{ _id, name, slug },
    "categories": categories[]->{ _id, name, slug }
  }
`);

export const allRiversQuery = defineQuery(`
  *[_type == "river"] | order(name asc) {
    _id,
    name,
    slug,
    description,
    image
  }
`);

export const riverBySlugQuery = defineQuery(`
  *[_type == "river" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    image
  }
`);

export const allActivitiesQuery = defineQuery(`
  *[_type == "activity"] | order(name asc) {
    _id,
    name,
    slug,
    description,
    image
  }
`);

export const allFaqsQuery = defineQuery(`
  *[_type == "faq"] | order(category asc, order asc) {
    _id,
    question,
    answer,
    category
  }
`);

export const siteSettingsQuery = defineQuery(`
  *[_type == "siteSettings"][0] {
    phone,
    email,
    address,
    socialLinks
  }
`);

export const pageBySlugQuery = defineQuery(`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    content
  }
`);
