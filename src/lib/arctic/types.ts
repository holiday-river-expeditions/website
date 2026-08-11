import { z } from 'zod';

/**
 * Zod schemas for the Arctic objects we consume. Field inventory comes from
 * Arctic's PHP wrapper models (github.com/arcticres/arctic-api); parsing is
 * deliberately lenient (coercions, passthrough-by-omission) because the API
 * is undocumented and unsupported — we validate what we use and ignore the
 * rest.
 */

// Arctic serializes booleans inconsistently across endpoints (true/"1"/1).
const looseBool = z
    .union([z.boolean(), z.number(), z.string()])
    .transform((v) => v === true || v === 1 || v === '1');

const looseInt = z.coerce.number().int();

/** A bookable product, e.g. "Cataract Canyon 5/6 Day". */
export const tripTypeSchema = z.object({
    id: looseInt,
    name: z.string(),
    shortname: z.string().nullish(),
    duration: z.coerce.string().nullish(),
    orenable: looseBool.nullish(),
    orname: z.string().nullish(),
    ordescription: z.string().nullish(),
    orminimumguests: looseInt.nullish(),
});
export type ArcticTripType = z.infer<typeof tripTypeSchema>;

/** A scheduled departure of a trip type. */
export const departureSchema = z.object({
    id: looseInt,
    triptypeid: looseInt.nullish(),
    name: z.string().nullish(),
    start: z.string(),
    starttime: z.string().nullish(),
    canceled: looseBool.nullish(),
    openings: looseInt.nullish(),
    remainingopenings: looseInt.nullish(),
    duration: z.coerce.string().nullish(),
    guests: looseInt.nullish(),
    onlinebookingurl: z.string().nullish(),
});
export type ArcticDeparture = z.infer<typeof departureSchema>;

/** Browse/query list envelope: `{entries: [...]}`. */
export function listEnvelope<T extends z.ZodTypeAny>(entry: T) {
    return z.object({ entries: z.array(entry) });
}

/**
 * A public pricing level for a trip type (from
 * /api/rest/triptype/{id}/pricinglevel). The cart API's form field for a
 * level is `pl_` + slugified uniquename — verified live 2026-08-10.
 */
export const pricingLevelSchema = z.object({
    id: looseInt,
    name: z.string(),
    description: z.string().nullish(),
    uniquename: z.string(),
    amount: z.coerce.number().nullish(),
    showonline: looseBool.nullish(),
    deleted: looseBool.nullish(),
    default: looseBool.nullish(),
});
export type ArcticPricingLevel = z.infer<typeof pricingLevelSchema>;

export const cartSchema = z.object({
    id: looseInt,
    sessid: z.string(),
});
export type ArcticCart = z.infer<typeof cartSchema>;

export const cartItemSchema = z.object({
    id: looseInt,
    name: z.string().nullish(),
    description: z.string().nullish(),
    summary: z.string().nullish(),
    is_available: looseBool.nullish(),
    quantity: looseInt.nullish(),
    cost: z.coerce.number().nullish(),
});
export type ArcticCartItem = z.infer<typeof cartItemSchema>;

/** POST {guest}/reserve/api/book/{departureId} response. */
export const bookResponseSchema = z.union([
    z.object({
        success: z.literal(true),
        cart: cartSchema,
        item: cartItemSchema,
        checkout: z.string(),
        interstitial: z.string().nullish(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string().nullish(),
        details: z.string().nullish(),
    }),
]);
export type ArcticBookResponse = z.infer<typeof bookResponseSchema>;

/** GET {guest}/cart/api/item response. */
export const cartContentsSchema = z.object({
    success: z.boolean(),
    cart: cartSchema
        .extend({ items: z.array(cartItemSchema).nullish() })
        .nullish(),
});
export type ArcticCartContents = z.infer<typeof cartContentsSchema>;
