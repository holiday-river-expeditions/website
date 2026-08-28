import { defineQuery } from 'next-sanity';

/**
 * Every grid on the site renders the same TripCard, so every grid projects
 * the same shape. This used to be copy-pasted at eight call sites, one of
 * which resolved the ribbon differently and could disagree with the rest.
 */
const TRIP_CARD = `
  _id,
  name,
  slug,
  tagline,
  subtitle,
  "ribbon": coalesce(ribbon, specialtyTypes[0]->ribbonLabel),
  startingPrice,
  durationLabel,
  "river": river->{ "name": coalesce(riverName, name), slug },
  "tripType": tripType->{ name, cardLabel, tagColor, slug },
  "image": photos[0]
`;

export const allTripsQuery = defineQuery(`
  *[_type == "trip"] | order(name asc) {
    ${TRIP_CARD},
    arcticTripId,
    "specialtyDepartures": specialtyDepartures[]{
      _key,
      startDate,
      label,
      note,
      "specialtyType": specialtyType->{ name, slug }
    }
  }
`);

/** Trip-finder wizard: the card projection plus the structured matching
    fields. Kept separate from allTripsQuery so /book and the listing grid
    don't pay for fields only the wizard reads. */
export const tripFinderTripsQuery = defineQuery(`
  *[_type == "trip"] | order(name asc) {
    ${TRIP_CARD},
    duration,
    minAge,
    "minAgeOverrides": minAgeOverrides[]{ months, minAge, reason },
    maxRapidClass,
    seasonMonths,
    craftTypes,
    arcticTripId
  }
`);

export const tripBySlugQuery = defineQuery(`
  *[_type == "trip" && slug.current == $slug][0] {
    ${TRIP_CARD},
    description,
    highlights,
    whatsIncluded,
    videoUrl,
    photos,
    pricingNotes,
    arcticTripId,
    whoIsThisFor,
    meetingPlace,
    deposit,
    minAge,
    season,
    maxRapidClass,
    duration,
    "river": river->{
      _id,
      name,
      "riverLabel": coalesce(riverName, name),
      slug,
      description,
      image,
      usgsSiteId,
      flowLinkUrl
    },
    "infoSections": infoSections[]{
      _key,
      overrideBody,
      "section": section->{ _id, title, slug, body }
    },
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
      count(relatedTrips) > 0 => relatedTrips[]->{ ${TRIP_CARD} },
      *[_type == "trip" && slug.current != $slug &&
        (river._ref == ^.river._ref || tripType._ref == ^.tripType._ref)
      ] | order(name asc) [0...3] { ${TRIP_CARD} }
    )
  }
`);

export const riverBySlugQuery = defineQuery(`
  *[_type == "river" && slug.current == $slug][0] {
    _id,
    name,
    "riverLabel": coalesce(riverName, name),
    slug,
    description,
    image,
    usgsSiteId,
    flowLinkUrl,
    "trips": *[_type == "trip" && river._ref == ^._id] | order(name asc) {
      ${TRIP_CARD}
    }
  }
`);

/** Landing pages: /rafting, /biking. Also picks up trips whose type lists
    with this one — combo trips appear under Biking (Aug 20 decision) while
    keeping their own card tag. */
export const tripTypeBySlugQuery = defineQuery(`
  *[_type == "tripType" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    image,
    "trips": *[
      _type == "trip" &&
      (tripType._ref == ^._id || tripType->listsWith._ref == ^._id)
    ] | order(name asc) {
      ${TRIP_CARD}
    }
  }
`);

/** Navigation order and the trip-finder's activity question. */
export const allTripTypesQuery = defineQuery(`
  *[_type == "tripType"] | order(order asc, name asc) {
    _id,
    name,
    slug,
    cardLabel,
    tagColor,
    "listsWith": listsWith->slug.current
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
      ${TRIP_CARD}
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
    "featuredTrips": featuredTrips[]->{ ${TRIP_CARD} },
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
