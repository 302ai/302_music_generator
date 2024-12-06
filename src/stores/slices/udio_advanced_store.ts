import { UdioAdvancedFormSchemaType } from "@/components/forms/tabs/schema";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export const initialUdioAdvanced: UdioAdvancedFormSchemaType = {
  promptStrength: 0.5,
  lyricsStrength: 0.5,
  clarityStrength: 0.5,
  quality: 0.75,
  negativePrompt: "",
};

export const udioAdvancedAtom = atomWithStorage<UdioAdvancedFormSchemaType>(
  "udioAdvanced",
  initialUdioAdvanced,
  createJSONStorage(() =>
    typeof window !== "undefined"
      ? localStorage
      : {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        }
  ),
  {
    getOnInit: true,
  }
);
