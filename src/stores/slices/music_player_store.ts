import type {
  AudioPlayerError,
  AudioPlayerState,
  AudioState,
  BufferedRange,
  PlaybackMode,
} from "@/hooks/music/use-audio-player";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type {
  AudioPlayerError,
  AudioPlayerState,
  AudioState,
  BufferedRange,
  PlaybackMode,
};

// Initial state
export const initialMusicPlayerState: AudioState = {
  currentIndex: 0,
  duration: 0,
  currentTime: 0,
  bufferedRanges: [],
  state: "idle",
  error: null,
  volume: 1,
  playbackRate: 1,
  playbackMode: "none",
  shuffleOrder: [],
  shuffleIndex: 0,
};

// Create individual atoms
export const currentTimeAtom = atomWithStorage(
  "musicPlayer.currentTime",
  initialMusicPlayerState.currentTime,
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

export const durationAtom = atomWithStorage(
  "musicPlayer.duration",
  initialMusicPlayerState.duration,
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

export const bufferedRangesAtom = atomWithStorage(
  "musicPlayer.bufferedRanges",
  initialMusicPlayerState.bufferedRanges,
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

export const playerStateAtom = atomWithStorage(
  "musicPlayer.state",
  initialMusicPlayerState.state,
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

export const playerErrorAtom = atomWithStorage(
  "musicPlayer.error",
  initialMusicPlayerState.error,
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

export const shuffleOrderAtom = atomWithStorage(
  "musicPlayer.shuffleOrder",
  initialMusicPlayerState.shuffleOrder,
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

export const shuffleIndexAtom = atomWithStorage(
  "musicPlayer.shuffleIndex",
  initialMusicPlayerState.shuffleIndex,
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

export const currentIndexAtom = atomWithStorage(
  "musicPlayer.currentIndex",
  initialMusicPlayerState.currentIndex,
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

export const volumeAtom = atomWithStorage(
  "musicPlayer.volume",
  initialMusicPlayerState.volume,
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

export const playbackRateAtom = atomWithStorage(
  "musicPlayer.playbackRate",
  initialMusicPlayerState.playbackRate,
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

export const playbackModeAtom = atomWithStorage(
  "musicPlayer.playbackMode",
  initialMusicPlayerState.playbackMode,
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
