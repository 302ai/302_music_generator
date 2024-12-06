// src/stores/slices/playlist_store.ts
import { SunoMusicData } from "@/services/suno";
import { UdioMusicData } from "@/services/udio";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { z } from "zod";

export const track = z.object({
  // Task ID, used by Suno
  task_id: z.string(),
  // Song ID
  id: z.string(),
  // Model
  model: z.string(),
  // Audio URL
  audio_url: z.string(),
  // Duration
  duration: z.number(),
  // Image URL
  image_url: z.string(),
  // Lyrics
  lyrics: z.string(),
  // Title
  title: z.string(),
  // Description: AI generated description
  description: z.string().nullable(),
  // Video URL, not available for Udio
  video_url: z.string().nullable(),
  // Version, some are continuations
  version: z.number().default(1),
});

export type Track = z.infer<typeof track>;

export interface PlaylistState {
  tracks: Track[];
  currentIndex: number;
}

export const initialPlaylist: PlaylistState = {
  tracks: [
    // {
    //   audio_url:
    //     "https://file.302.ai/gpt/imgs/20241202/7e291874d88a4feb8def1c2a6362c278.mp3",
    //   id: "d013330b-97c2-4055-828f-0bc8c352a1a6",
    //   model: "chirp-v3-5",
    //   duration: 172,
    //   image_url:
    //     "https://file.302.ai/gpt/imgs/20241202/addbd9881ef54770a878386869fc93f6.jpeg",
    //   lyrics:
    //     "[Verse]\n在黑夜中漫步\n寻找心灵归宿\n佛光从云端洒落\n指引前路方向\n\n[Verse 2]\n风起云涌之时\n心灵却愈加透明\n繁星闪烁不停\n照亮内心光明\n\n[Chorus]\n佛光在心田升起\n温暖了每个足迹\n陪伴我走过风雨\n带来无尽的安宁\n\n[Verse 3]\n迷失在尘世喧嚣\n寻找到内心的乐土\n佛光如梦一般缥缈\n却实在而真实可靠\n\n[Bridge]\n一步一步向前走\n尘世烦恼渐渐消\n佛光照亮每一寸\n心灵自由不再怕\n\n[Chorus]\n佛光在心田升起\n温暖了每个足迹\n陪伴我走过风雨\n带来无尽的安宁",
    //   task_id: "b28bc9f2-d484-457f-9ad3-4484dd43596f_1",
    //   title: "佛光",
    //   description: "佛光普照，心灵安宁",
    //   video_url:
    //     "https://file.302.ai/gpt/imgs/20241202/dea325791847424bb6ec6d666fb341f5.mp4",
    //   version: 1,
    // },
    // {
    //   audio_url:
    //     "https://file.302.ai/gpt/imgs/20241202/e44de20a25304e7884e422c5ef934590.mp3",
    //   id: "5ef3e460-8b3d-4f8d-b45b-a7aca83d3b26",
    //   model: "chirp-v3-5",
    //   duration: 163,
    //   image_url:
    //     "https://file.302.ai/gpt/imgs/20241202/4a8e9e797cac43e18abc24b9f4df4e90.jpeg",
    //   lyrics:
    //     "[Verse]\n在黑夜中漫步\n寻找心灵归宿\n佛光从云端洒落\n指引前路方向\n\n[Verse 2]\n风起云涌之时\n心灵却愈加透明\n繁星闪烁不停\n照亮内心光明\n\n[Chorus]\n佛光在心田升起\n温暖了每个足迹\n陪伴我走过风雨\n带来无尽的安宁\n\n[Verse 3]\n迷失在尘世喧嚣\n寻找到内心的乐土\n佛光如梦一般缥缈\n却实在而真实可靠\n\n[Bridge]\n一步一步向前走\n尘世烦恼渐渐消\n佛光照亮每一寸\n心灵自由不再怕\n\n[Chorus]\n佛光在心田升起\n温暖了每个足迹\n陪伴我走过风雨\n带来无尽的安宁",
    //   task_id: "b28bc9f2-d484-457f-9ad3-4484dd43596f_2",
    //   title: "佛光",
    //   description: "佛光普照，心灵安宁",
    //   video_url:
    //     "https://file.302.ai/gpt/imgs/20241202/3e0ecd59a24b4cf1995ae70827b84e0e.mp4",
    //   version: 1,
    // },
  ],
  currentIndex: 0,
};

export const playlistAtom = atomWithStorage<PlaylistState>(
  "playlist",
  initialPlaylist,
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

export const addTrackAtom = atom(null, (get, set, track: Track) => {
  set(playlistAtom, (state) => ({
    ...state,
    tracks: [...state.tracks, track],
  }));
});

export const removeTrackAtom = atom(null, (get, set, id: string) => {
  set(playlistAtom, (state) => ({
    ...state,
    tracks: state.tracks.filter((track) => track.id !== id),
  }));
});

export const mapSunoMusicDataToTrack = (
  data: SunoMusicData,
  model: string,
  description: string | undefined | null
): Track => {
  return {
    task_id: data.task_id || "",
    id: data.clip_id || "",
    model,
    audio_url: data.audio_url || "",
    duration: data.duration || 0,
    image_url: data.image_url || "",
    lyrics: data.prompt || "",
    title: data.title || "",
    description: description || null,
    video_url: data.video_url,
    version: 1,
  };
};

export const mapUdioMusicDataToTrack = (
  data: UdioMusicData,
  model: string,
  description: string | undefined | null
): Track => {
  return {
    task_id: data.generation_id || "",
    id: data.id || "",
    model,
    audio_url: data.song_path || "",
    duration: data.duration || 0,
    image_url: data.image_path || "",
    lyrics: data.lyrics || "",
    title: data.title || "",
    description: description || null,
    video_url: null,
    version: 1,
  };
};
