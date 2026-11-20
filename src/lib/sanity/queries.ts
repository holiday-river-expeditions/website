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
  ribbon,
  startingPrice,
  arcticTripId,
  durationLabel,
  "river": river->{ "name": coalesce(riverName, name), slug },
  "tripType": tripType->{ name, cardLabel, tagColor, slug },
  "image": photos[0]
`;

export const allTripsQuery = defineQuery(`
  *[_type == "trip"] | order(name asc) {
    ${TRIP_CARD},
    "specialtyDepartures": specialtyDepartures[]{
      _key,
      startDate,
      label,
      note,
      slug,
      phoneOnly,
      "specialtyType": specialtyType->{ _id, name, slug }
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
    craftTypes
  }
`);

/** The Find Your Trip singleton: questions, answers, dials, tuning. Read
    through src/lib/trip-finder-spec.ts, which validates it and falls back
    to the in-code default when the document is missing or malformed. */
export const tripFinderSpecQuery = defineQuery(`
  *[_type == "tripFinderSpec"][0] {
    minConfidentScore,
    resultsShown,
    "fallbackTripSlug": fallbackTrip->slug.current,
    "questions": questions[] {
      _key,
      kind,
      title,
      subline,
      shortLabel,
      skipLabel,
      ethos,
      weight,
      image,
      "onlyWhen": onlyWhen { question, answer },
      "skipWhen": skipWhen { question, answer },
      "options": options[] {
        _key,
        label,
        value,
        sublabel,
        bikeSublabel,
        targetClass,
        floorAge,
        centerDays,
        month,
        "tripTypeSlug": tripType->slug.current
      }
    }
  }
`);

export const tripBySlugQuery = defineQuery(`
  *[_type == "trip" && slug.current == $slug][0] {
    ${TRIP_CARD},
    description,
    highlights,
    whatsIncluded,
    landAcknowledgement,
    videoUrl,
    photos,
    pricingNotes,
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
      flowLinkUrl,
      "mapPoints": mapPoints[]{ _key, title, location, image, caption }
    },
    "infoSections": infoSections[]{
      _key,
      overrideBody,
      "section": section->{ _id, title, slug, body }
    },
    "specialtyDepartures": specialtyDepartures[]{
      _key,
      startDate,
      label,
      note,
      slug,
      body,
      image,
      phoneOnly,
      minAge,
      priceText,
      lengthText,
      "specialtyType": specialtyType->{ _id, name, slug }
    },
    featuredReview,
    "reviews": reviews[]{ _key, quote, author, source },
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

/** Every specialty date with what's needed to work out its page slug.
    /specialty/[slug] finds its trip here, and the sitemap lists them.
    Trips with Arctic ids come along too, since Arctic keywords can give
    them dates no Sanity entry names. */
export const specialtyDateIndexQuery = defineQuery(`
  *[_type == "trip" && defined(slug.current) && (count(specialtyDepartures) > 0 || defined(arcticTripId)) && !(_id in path("drafts.**"))] | order(slug.current asc) {
    "tripSlug": slug.current,
    _updatedAt,
    arcticTripId,
    "entries": specialtyDepartures[]{ _key, startDate, label, slug, phoneOnly }
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
    arcticKeywords
  }
`);

/** Specialty families that Arctic keywords map to, in hub order. The
    first family to claim one of a departure's keywords is its family. */
export const specialtyFamiliesQuery = defineQuery(`
  *[_type == "specialtyType" && count(arcticKeywords) > 0] | order(order asc, name asc) {
    _id,
    name,
    slug,
    arcticKeywords
  }
`);

/** Trips that can have specialty dates on /specialty: ones with Sanity
    entries, and ones with Arctic ids whose departures keywords can tag.
    Entries carry their family so the hub can split them by section. */
export const specialtyDatedTripsQuery = defineQuery(`
  *[_type == "trip" && (count(specialtyDepartures) > 0 || defined(arcticTripId))] | order(name asc) {
    _id,
    name,
    slug,
    startingPrice,
    arcticTripId,
    "image": photos[0],
    "entries": specialtyDepartures[]{
      _key,
      startDate,
      label,
      note,
      slug,
      image,
      phoneOnly,
      priceText,
      lengthText,
      "specialtyType": specialtyType->{ _id, name, slug }
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
    reviews,
    whatsIncluded
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

/** A Learn & Get Inspired card without its own photo borrows the main
    image of the blog post it links to, so it never renders as an empty
    grey box. An image set on the card still wins. */
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
      "image": coalesce(
        image,
        *[_type == "post" && "/blog/" + slug.current == ^.link][0].mainImage
      ),
      link,
      isVideo
    }
  }
`);

/** sitemap.xml: every Sanity document that has its own public route, with
    the timestamp used for <lastmod>. Published only: drafts are filtered
    out even if a token-authenticated client ever runs this. */
export const sitemapQuery = defineQuery(`
  {
    "homepage": *[_type == "homepage" && !(_id in path("drafts.**"))][0] { _updatedAt },
    "tripTypes": *[_type == "tripType" && defined(slug.current) && !(_id in path("drafts.**"))] {
      "slug": slug.current,
      _updatedAt
    },
    "trips": *[_type == "trip" && defined(slug.current) && !(_id in path("drafts.**"))] | order(slug.current asc) {
      "slug": slug.current,
      _updatedAt
    },
    "rivers": *[_type == "river" && defined(slug.current) && !(_id in path("drafts.**"))] | order(slug.current asc) {
      "slug": slug.current,
      _updatedAt
    },
    "posts": *[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))] | order(slug.current asc) {
      "slug": slug.current,
      _updatedAt
    },
    "pages": *[_type == "page" && defined(slug.current) && !(_id in path("drafts.**"))] | order(slug.current asc) {
      "slug": slug.current,
      _updatedAt
    }
  }
`);
