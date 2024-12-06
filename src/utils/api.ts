/**
 * @fileoverview API utility functions for handling URL formatting and normalization.
 * @author zpl
 * @created 2024-11-20
 */

/**
 * Normalizes a URL by removing trailing slashes.
 * Ensures consistent URL formatting across the application.
 *
 * @function
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL without trailing slashes
 *
 * @example
 * ```typescript
 * normalizeUrl('https://api.example.com/') // returns 'https://api.example.com'
 * normalizeUrl('https://api.example.com///') // returns 'https://api.example.com'
 * ```
 */
export const normalizeUrl = (url: string) => {
  return url.replace(/\/+$/, "");
};
