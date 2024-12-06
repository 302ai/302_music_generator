"use client";
import { env } from "@/env";
import { languageAtom, store } from "@/stores";
import { langToCountry } from "@/utils/302";
import ky from "ky";

export const authKy = ky.create({
  prefixUrl: env.NEXT_PUBLIC_AUTH_API_URL,
  timeout: 60000,
  hooks: {
    beforeRequest: [
      (request) => {
        // Some 302 endpoints require the language to be set, so we set it here
        const uiLanguage = store.get(languageAtom);
        if (uiLanguage) {
          request.headers.set("Lang", langToCountry(uiLanguage));
        }
      },
    ],
  },
});
