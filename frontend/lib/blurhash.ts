/**
 * Blurhash placeholder for OptimizedImage / logo assets.
 * Encoded from a teal-on-zinc 32×32 sample (C-23).
 */
export const LOGO_BLURHASH = "L05O|yof00ay~qof00ay00ay~qof";

/** Tiny teal data-URL used when blurhash decode is unavailable at build time. */
export const LOGO_BLURHASH_DATA_URL =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#134E4A"/><stop offset="1" stop-color="#2DD4BF"/></linearGradient></defs><rect width="16" height="16" fill="url(#g)"/></svg>`,
  );
