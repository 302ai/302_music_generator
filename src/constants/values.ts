/**
 * @fileoverview Global constants and configuration values used throughout the application.
 * @author zpl
 * @created 2024-11-20
 */

export const THEME_COOKIE_NAME = "theme";
export const EMPTY_THEME = "light";
export const TRUE_STRING = "true";
export const FALSE_STRING = "false";
export const CHINA_REGION = "0";
export const OUTSIDE_DEPLOY_MODE = "OUTSIDE";
export const INTERNAL_DEPLOY_MODE = "INTERNAL";
export const SHARE_CODE_URL_PARAM = "pwd";
export const SHARE_CODE_STORE_KEY = "share_code";
export const SHARE_CODE_REMEMBER_KEY = "share_code_remember";

export const GLOBAL = {
  /**
   * Internationalization (i18n) configuration settings.
   * @property {Object} LOCALE - Locale-related constants
   * @property {string[]} LOCALE.SUPPORTED - List of supported language codes:
   *   - 'zh': Chinese
   *   - 'en': English
   *   - 'ja': Japanese
   * @property {string} LOCALE.DEFAULT - Default language code (English)
   */
  LOCALE: {
    SUPPORTED: ["zh", "en", "ja"],
    DEFAULT: "en",
  },
  MODEL: {
    SUPPORTED: [
      {
        value: "chirp-v3-5",
        label: "Suno v3.5",
      },
      {
        value: "chirp-v4",
        label: "Suno v4",
      },
      {
        value: "udio32-v1.5",
        label: "Udio v1.5 (32s)",
      },
      {
        value: "udio130-v1.5",
        label: "Udio v1.5 (130s)",
      },
    ],
    DEFAULT: "chirp-v3-5",
  },
  Udio: {
    QUALITY: {
      LOW: "low",
      MEDIUM: "medium",
      HIGH: "high",
      HIGHEST: "highest",
    },
    DEFAULT_QUALITY: "medium",
  },
};

export const mapModelToLabel = (model: string) => {
  return GLOBAL.MODEL.SUPPORTED.find((m) => m.value === model)?.label || model;
};
