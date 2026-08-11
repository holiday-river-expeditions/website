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
