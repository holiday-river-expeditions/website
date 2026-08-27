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
    tagline,
    subtitle,
    "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel),
    startingPrice,
    durationLabel,
    "river": river->{ "name": coalesce(riverName, name), slug },
    "activities": activities[]->{ name, slug },
    "categories": categories[]->{ name, slug },
    "specialtyDepartures": specialtyDepartures[]{
      _key,
      startDate,
      label,
      note,
      "specialtyType": specialtyType->{ name, slug }
    },
    "mainImage": photos[0]
  }
`);

/** Trip-finder wizard: the TripCard projection plus the structured
    matching fields. Kept separate from allTripsQuery so /book and the
    listing grid don't pay for fields only the wizard reads. */
export const tripFinderTripsQuery = defineQuery(`
  *[_type == "trip"] | order(name asc) {
    _id,
    name,
    slug,
    tagline,
    subtitle,
    "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel),
    startingPrice,
    durationLabel,
    duration,
    minAge,
    "minAgeOverrides": minAgeOverrides[]{ months, minAge, reason },
    maxRapidClass,
    seasonMonths,
    craftTypes,
    arcticTripId,
    "river": river->{ "name": coalesce(riverName, name), slug },
    "activities": activities[]->{ name, slug },
    "category": categories[0]->name,
    "image": photos[0]
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
    tagline,
    subtitle,
    "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel),
    startingPrice,
    durationLabel,
    "river": river->{ _id, name, slug, description, image, usgsSiteId, flowLinkUrl },
    "activities": activities[]->{ _id, name, slug },
    "categories": categories[]->{ _id, name, slug },
    minAge,
    season,
    "specialtyTypes": specialtyTypes[]->{ _id, name, slug, ribbonLabel },
    "specialtyDepartures": specialtyDepartures[]{
      _key,
      startDate,
      label,
      note,
      "specialtyType": specialtyType->{ name, slug }
    },
    featuredReview,
    itinerary,
    "faqs": faqs[]->{ _id, question, answer, category },
    "relatedTrips": select(
      count(relatedTrips) > 0 => relatedTrips[]->{
        _id, name, slug, tagline, subtitle, "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel), startingPrice,
        durationLabel, "river": river->{ "name": coalesce(riverName, name) },
        "category": categories[0]->name,
        "image": photos[0]
      },
      *[_type == "trip" && slug.current != $slug &&
        (river._ref == ^.river._ref ||
         count(activities[@._ref in ^.^.activities[]._ref]) > 0)
      ] | order(name asc) [0...3] {
        _id, name, slug, tagline, subtitle, "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel), startingPrice,
        durationLabel, "river": river->{ "name": coalesce(riverName, name) },
        "category": categories[0]->name,
        "image": photos[0]
      }
    )
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
    image,
    usgsSiteId,
    flowLinkUrl,
    "trips": *[_type == "trip" && river._ref == ^._id] | order(name asc) {
      _id,
      name,
      slug,
      tagline,
      subtitle,
      "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel),
      startingPrice,
      durationLabel,
      "river": river->{ "name": coalesce(riverName, name) },
      "category": categories[0]->name,
      "image": photos[0]
    }
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

export const activityBySlugQuery = defineQuery(`
  *[_type == "activity" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    image,
    "trips": *[_type == "trip" && references(^._id)] | order(name asc) {
      _id,
      name,
      slug,
      tagline,
      subtitle,
      "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel),
      startingPrice,
      durationLabel,
      "river": river->{ "name": coalesce(riverName, name) },
      "category": categories[0]->name,
      "image": photos[0]
    }
  }
`);

export const allSpecialtyTypesQuery = defineQuery(`
  *[_type == "specialtyType"] | order(order asc, name asc) {
    _id,
    name,
    slug,
    tagline,
    description,
    image,
    ribbonLabel,
    "trips": *[_type == "trip" && references(^._id)] | order(name asc) {
      _id,
      name,
      slug,
      tagline,
      subtitle,
      "ribbon": coalesce(ribbon, ^.ribbonLabel),
      startingPrice,
      durationLabel,
      "river": river->{ "name": coalesce(riverName, name) },
      "category": categories[0]->name,
      "image": photos[0]
    }
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
    socialLinks,
    reviews
  }
`);

export const allPostsQuery = defineQuery(`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage,
    publishedAt,
    category
  }
`);

export const postBySlugQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    mainImage,
    publishedAt,
    category,
    body
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

export const homepageQuery = defineQuery(`
  *[_type == "homepage"][0] {
    heroHeading,
    heroImage,
    "heroImageAlt": heroImage.alt,
    heroCtaText,
    heroCtaLink,
    "featuredTrips": featuredTrips[]->{
      _id,
      name,
      slug,
      tagline,
      subtitle,
      "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel),
      startingPrice,
      durationLabel,
      "river": river->{ "name": coalesce(riverName, name) },
      "category": categories[0]->name,
      "image": photos[0]
    },
    storyBody,
    storyImageLeft,
    storyImagePortrait,
    storyCtaText,
    storyCtaLink,
    "rivers": rivers[]->{
      _id,
      name,
      slug,
      image,
      "tripCount": count(*[_type == "trip" && references(^._id)]),
      "tripSlug": *[_type == "trip" && references(^._id)][0].slug.current,
      description
    },
    learnContent[]{
      _key,
      title,
      image,
      link,
      isVideo
    }
  }
`);
