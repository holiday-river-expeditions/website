/**
 * What a specialty date's pinned page address may hold: lowercase letters,
 * numbers and single hyphens. In its own file with no imports so the
 * Sanity schema can use it too (the Studio and `sanity schema extract`
 * load schemas outside Next's path aliases).
 */
export const SPECIALTY_SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
