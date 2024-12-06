import { appConfigAtom, store } from "@/stores";
import ky from "ky";

export const generateMusicStyles = async (lyrics: string) => {
  const apiKey = store.get(appConfigAtom).apiKey;
  return await ky
    .post("/api/completion", {
      json: { prompt: lyrics, apiKey },
    })
    .json<{ styles: string[] }>();
};
