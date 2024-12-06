import { createScopedLogger } from "@/utils";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useTransition,
} from "react";

const logger = createScopedLogger("useAudioPlayer");

// Export interfaces and type definitions
export interface BufferedRange {
  start: number;
  end: number;
}

export interface PlaylistItem {
  url: string;
  title?: string;
}

export type AudioPlayerState =
  | "idle"
  | "ready"
  | "playing"
  | "paused"
  | "stopped"
  | "ended"
  | "buffering"
  | "error";
const playbackModes: PlaybackMode[] = [
  "none",
  "loop-all",
  "loop-one",
  "shuffle",
];
export type PlaybackMode = "none" | "loop-one" | "loop-all" | "shuffle";

export interface AudioPlayerError extends Error {
  code?: number;
}

export interface AudioState {
  currentIndex: number;
  duration: number;
  currentTime: number;
  bufferedRanges: BufferedRange[];
  state: AudioPlayerState;
  error: AudioPlayerError | null;
  volume: number;
  playbackRate: number;
  playbackMode: PlaybackMode;
  shuffleOrder: number[];
  shuffleIndex: number;
}

const STORAGE_KEY = {
  VOLUME: "audio-player-volume",
  PLAYBACK_RATE: "audio-player-playback-rate",
  PLAYBACK_MODE: "audio-player-playback-mode",
  CURRENT_INDEX: "audio-player-current-index",
};

function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    logger.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

function setStoredValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn(`Error setting localStorage key "${key}":`, error);
  }
}

interface StorageConfig<T> {
  get: () => T;
  set: (value: T) => void;
}

type AudioPlayerStorage = {
  [K in keyof AudioState]?: StorageConfig<AudioState[K]>;
};

function getInitialState(storage?: AudioPlayerStorage): AudioState {
  return {
    currentIndex:
      storage?.currentIndex?.get() ??
      getStoredValue(STORAGE_KEY.CURRENT_INDEX, 0),
    duration: storage?.duration?.get() ?? 0,
    currentTime: storage?.currentTime?.get() ?? 0,
    bufferedRanges: storage?.bufferedRanges?.get() ?? [],
    state: storage?.state?.get() ?? "idle",
    error: storage?.error?.get() ?? null,
    volume: storage?.volume?.get() ?? getStoredValue(STORAGE_KEY.VOLUME, 1),
    playbackRate:
      storage?.playbackRate?.get() ??
      getStoredValue(STORAGE_KEY.PLAYBACK_RATE, 1),
    playbackMode:
      storage?.playbackMode?.get() ??
      getStoredValue(STORAGE_KEY.PLAYBACK_MODE, "none"),
    shuffleOrder: storage?.shuffleOrder?.get() ?? [],
    shuffleIndex: storage?.shuffleIndex?.get() ?? 0,
  };
}

type AudioAction =
  | {
      type: "SET_CURRENT_INDEX";
      payload: number | ((prevIndex: number) => number);
    }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_CURRENT_TIME"; payload: number }
  | { type: "SET_BUFFERED_RANGES"; payload: BufferedRange[] }
  | { type: "SET_STATE"; payload: AudioPlayerState }
  | { type: "SET_ERROR"; payload: AudioPlayerError | null }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_PLAYBACK_RATE"; payload: number }
  | { type: "SET_PLAYBACK_MODE"; payload: PlaybackMode }
  | {
      type: "SET_SHUFFLE_ORDER";
      payload: number[] | ((prevOrder: number[]) => number[]);
    }
  | {
      type: "SET_SHUFFLE_INDEX";
      payload: number | ((prevIndex: number) => number);
    };

function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case "SET_CURRENT_INDEX":
      return {
        ...state,
        currentIndex:
          typeof action.payload === "function"
            ? action.payload(state.currentIndex)
            : action.payload,
      };
    case "SET_DURATION":
      return { ...state, duration: action.payload };
    case "SET_CURRENT_TIME":
      return { ...state, currentTime: action.payload };
    case "SET_BUFFERED_RANGES":
      return { ...state, bufferedRanges: action.payload };
    case "SET_STATE":
      return { ...state, state: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_VOLUME":
      return { ...state, volume: action.payload };
    case "SET_PLAYBACK_RATE":
      return { ...state, playbackRate: action.payload };
    case "SET_PLAYBACK_MODE":
      return { ...state, playbackMode: action.payload };
    case "SET_SHUFFLE_ORDER":
      return {
        ...state,
        shuffleOrder:
          typeof action.payload === "function"
            ? action.payload(state.shuffleOrder)
            : action.payload,
      };
    case "SET_SHUFFLE_INDEX":
      return {
        ...state,
        shuffleIndex:
          typeof action.payload === "function"
            ? action.payload(state.shuffleIndex)
            : action.payload,
      };
    default:
      return state;
  }
}

function resetAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.src = "";
  audio.load();
}

function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  limit: number
): T {
  let lastFunc: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number = Date.now();

  return ((...args: Parameters<T>) => {
    if (Date.now() - lastRan >= limit) {
      callback(...args);
      lastRan = Date.now();
    } else {
      if (lastFunc) {
        clearTimeout(lastFunc);
      }
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            callback(...args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan)
      );
    }
  }) as T;
}

/**
 * Custom audio player hook
 * @param playlist Playlist array or single audio URL
 */
export function useAudioPlayer(
  playlist: PlaylistItem[] | string,
  storage?: AudioPlayerStorage
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [state, dispatch] = useReducer<React.Reducer<AudioState, AudioAction>>(
    audioReducer,
    getInitialState(storage)
  );

  // Use useMemo to normalize playlist and add logging
  const normalizedPlaylist = useMemo<PlaylistItem[]>(() => {
    logger.debug("Normalizing playlist", playlist);
    if (!playlist || (Array.isArray(playlist) && playlist.length === 0)) {
      return [];
    }
    return typeof playlist === "string" ? [{ url: playlist }] : playlist;
  }, [playlist]);

  // Current playing track
  const currentTrack = useMemo(
    () =>
      normalizedPlaylist.length > 0
        ? normalizedPlaylist[state.currentIndex]
        : null,
    [normalizedPlaylist, state.currentIndex]
  );

  // Update audio duration
  const updateDuration = useCallback(() => {
    if (audioRef.current) {
      dispatch({ type: "SET_DURATION", payload: audioRef.current.duration });
    }
  }, []);

  const throttledSetCurrentTime = useMemo(
    () =>
      throttle((time: number) => {
        dispatch({ type: "SET_CURRENT_TIME", payload: time });
      }, 250),
    [dispatch]
  );

  const updateCurrentTime = useCallback(() => {
    if (audioRef.current) {
      throttledSetCurrentTime(audioRef.current.currentTime);
    }
  }, [throttledSetCurrentTime]);

  const throttledSetBufferedRanges = useMemo(
    () =>
      throttle((ranges: BufferedRange[]) => {
        dispatch({ type: "SET_BUFFERED_RANGES", payload: ranges });
      }, 500),
    [dispatch]
  );

  const updateBufferedRanges = useCallback(() => {
    if (!audioRef.current) return;
    const buffer = audioRef.current.buffered;
    const bufferRanges: BufferedRange[] = [];
    for (let i = 0; i < buffer.length; i++) {
      bufferRanges.push({
        start: buffer.start(i),
        end: buffer.end(i),
      });
    }
    throttledSetBufferedRanges(bufferRanges);
  }, [throttledSetBufferedRanges]);

  const handleError = useCallback(() => {
    if (audioRef.current) {
      const error: AudioPlayerError = new Error("Audio playback error");
      error.code = audioRef.current.error?.code;
      dispatch({ type: "SET_ERROR", payload: error });
      dispatch({ type: "SET_STATE", payload: "error" });
    }
  }, []);

  const handleBuffering = useCallback(() => {
    // dispatch({ type: "SET_STATE", payload: "buffering" });
  }, []);

  const handleCanPlay = useCallback(() => {
    // console.log("handleCanPlay", state.state);
    // if (state.state !== "playing") {
    //   console.log("handleCanPlay", state.state);
    //   dispatch({ type: "SET_STATE", payload: "playing" });
    // }
  }, [state.state]);

  // Generate random play order
  const generateShuffleOrder = useCallback(() => {
    const indices = normalizedPlaylist.map((_, index) => index);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [normalizedPlaylist]);

  const next = useCallback(() => {
    if (!audioRef.current || normalizedPlaylist.length === 0) {
      return;
    }
    if (
      state.playbackMode === "loop-one" ||
      state.playbackMode === "loop-all" ||
      state.playbackMode === "none"
    ) {
      dispatch({
        type: "SET_CURRENT_INDEX",
        payload: (prevIndex: number) =>
          (prevIndex + 1) % normalizedPlaylist.length,
      });
    } else if (state.playbackMode === "shuffle") {
      const nextShuffleIndex = state.shuffleIndex + 1;
      if (nextShuffleIndex < state.shuffleOrder.length) {
        dispatch({ type: "SET_SHUFFLE_INDEX", payload: nextShuffleIndex });
        dispatch({
          type: "SET_CURRENT_INDEX",
          payload: state.shuffleOrder[nextShuffleIndex],
        });
      } else {
        const newOrder = generateShuffleOrder();
        dispatch({ type: "SET_SHUFFLE_ORDER", payload: newOrder });
        dispatch({ type: "SET_SHUFFLE_INDEX", payload: 0 });
        dispatch({ type: "SET_CURRENT_INDEX", payload: newOrder[0] });
      }
    }
  }, [
    state.playbackMode,
    normalizedPlaylist.length,
    generateShuffleOrder,
    state.shuffleIndex,
    state.shuffleOrder,
  ]);

  const previous = useCallback(() => {
    if (!audioRef.current || normalizedPlaylist.length === 0) {
      return;
    }
    if (
      state.playbackMode === "loop-one" ||
      state.playbackMode === "loop-all" ||
      state.playbackMode === "none"
    ) {
      dispatch({
        type: "SET_CURRENT_INDEX",
        payload: (prevIndex: number) =>
          (prevIndex - 1 + normalizedPlaylist.length) %
          normalizedPlaylist.length,
      });
    } else if (state.playbackMode === "shuffle") {
      const prevShuffleIndex = state.shuffleIndex - 1;
      if (prevShuffleIndex >= 0) {
        dispatch({ type: "SET_SHUFFLE_INDEX", payload: prevShuffleIndex });
        dispatch({
          type: "SET_CURRENT_INDEX",
          payload: state.shuffleOrder[prevShuffleIndex],
        });
      } else {
        const newOrder = generateShuffleOrder();
        dispatch({ type: "SET_SHUFFLE_ORDER", payload: newOrder });
        dispatch({
          type: "SET_SHUFFLE_INDEX",
          payload: newOrder.length - 1,
        });
        dispatch({
          type: "SET_CURRENT_INDEX",
          payload: newOrder[newOrder.length - 1],
        });
      }
    }
  }, [
    state.playbackMode,
    normalizedPlaylist.length,
    generateShuffleOrder,
    state.shuffleIndex,
    state.shuffleOrder,
  ]);

  const handleEnded = useCallback(() => {
    if (state.playbackMode !== "none") {
      next();
    } else {
      dispatch({ type: "SET_STATE", payload: "ended" });
    }
  }, [state.playbackMode, next]);

  // Initialize Audio and manage event listeners
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // logger.debug("audioRef.current", audioRef.current);

    const audio = audioRef.current;

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("timeupdate", updateCurrentTime);
    audio.addEventListener("progress", updateBufferedRanges);
    audio.addEventListener("error", handleError);
    audio.addEventListener("waiting", handleBuffering);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("timeupdate", updateCurrentTime);
      audio.removeEventListener("progress", updateBufferedRanges);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("waiting", handleBuffering);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [
    updateDuration,
    updateBufferedRanges,
    handleError,
    handleBuffering,
    handleCanPlay,
    handleEnded,
  ]);

  // Clean up Audio instance on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        resetAudio(audioRef.current);
        dispatch({ type: "SET_STATE", payload: "idle" });
        audioRef.current = null;
      }
    };
  }, []);

  // Monitor settings changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
      audioRef.current.playbackRate = state.playbackRate;
      audioRef.current.loop = state.playbackMode === "loop-one";
    }
  }, [state.volume, state.playbackRate, state.playbackMode]);

  // Handle playlist updates
  useEffect(() => {
    if (
      state.playbackMode === "shuffle" &&
      (state.shuffleOrder.length === 0 ||
        normalizedPlaylist.length !== state.shuffleOrder.length)
    ) {
      const order = generateShuffleOrder();
      dispatch({ type: "SET_SHUFFLE_ORDER", payload: order });
      dispatch({ type: "SET_SHUFFLE_INDEX", payload: 0 });
      dispatch({ type: "SET_CURRENT_INDEX", payload: order[0] });
    } else if (state.currentIndex >= normalizedPlaylist.length) {
      dispatch({ type: "SET_CURRENT_INDEX", payload: 0 });
    }
  }, [
    normalizedPlaylist.length,
    generateShuffleOrder,
    state.playbackMode,
    state.shuffleOrder.length,
    state.currentIndex,
  ]);

  // Move play function declaration before jumpTo
  const play = useCallback(() => {
    if (!audioRef.current || !currentTrack) {
      return;
    }
    logger.debug("play");
    audioRef.current
      .play()
      .then(() => dispatch({ type: "SET_STATE", payload: "playing" }))
      .catch(handleError);
  }, [currentTrack, handleError]);

  const jumpTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < normalizedPlaylist.length) {
        dispatch({ type: "SET_CURRENT_INDEX", payload: index });
        dispatch({ type: "SET_STATE", payload: "playing" });

        if (state.playbackMode === "shuffle") {
          const newShuffleIndex = state.shuffleOrder.indexOf(index);
          if (newShuffleIndex !== -1) {
            dispatch({ type: "SET_SHUFFLE_INDEX", payload: newShuffleIndex });
          } else {
            const newOrder = generateShuffleOrder();
            dispatch({ type: "SET_SHUFFLE_ORDER", payload: newOrder });
            const newIndex = newOrder.indexOf(index);
            dispatch({
              type: "SET_SHUFFLE_INDEX",
              payload: newIndex !== -1 ? newIndex : 0,
            });
          }
        }
      }
    },
    [
      normalizedPlaylist,
      state.playbackMode,
      state.shuffleOrder,
      generateShuffleOrder,
    ]
  );

  // Modify handling of audio.src updates
  useEffect(() => {
    if (!audioRef.current || !currentTrack) {
      dispatch({ type: "SET_STATE", payload: "idle" });
      return;
    }

    if (audioRef.current.src !== currentTrack.url) {
      resetAudio(audioRef.current);
      audioRef.current.src = currentTrack.url;
      logger.debug("src:", currentTrack.url);

      // If previously playing, auto-play when audio is ready
      if (state.state === "playing") {
        const handleCanPlay = () => {
          play();
          audioRef.current?.removeEventListener("canplay", handleCanPlay);
        };
        audioRef.current.addEventListener("canplay", handleCanPlay);
        return () => {
          audioRef.current?.removeEventListener("canplay", handleCanPlay);
        };
      }
    }
  }, [currentTrack, state.state, play]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      dispatch({ type: "SET_STATE", payload: "paused" });
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      dispatch({ type: "SET_CURRENT_TIME", payload: 0 });
      dispatch({ type: "SET_STATE", payload: "stopped" });
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      dispatch({ type: "SET_CURRENT_TIME", payload: time });
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const constrainedVolume = Math.min(Math.max(newVolume, 0), 1);
    dispatch({ type: "SET_VOLUME", payload: constrainedVolume });
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const constrainedRate = Math.min(Math.max(rate, 0), 3);
    dispatch({ type: "SET_PLAYBACK_RATE", payload: constrainedRate });
  }, []);

  const setPlaybackMode = useCallback((mode: PlaybackMode) => {
    dispatch({ type: "SET_PLAYBACK_MODE", payload: mode });
  }, []);

  const togglePlaybackMode = useCallback(() => {
    startTransition(() => {
      const currentIndex = playbackModes.indexOf(state.playbackMode);
      const nextIndex = (currentIndex + 1) % playbackModes.length;
      dispatch({
        type: "SET_PLAYBACK_MODE",
        payload: playbackModes[nextIndex],
      });
    });
  }, [state.playbackMode]);

  // Sync all states with storage
  useEffect(() => {
    storage?.currentTime?.set(state.currentTime);
  }, [state.currentTime, storage]);

  useEffect(() => {
    storage?.duration?.set(state.duration);
  }, [state.duration, storage]);

  useEffect(() => {
    storage?.bufferedRanges?.set(state.bufferedRanges);
  }, [state.bufferedRanges, storage]);

  useEffect(() => {
    storage?.state?.set(state.state);
  }, [state.state, storage]);

  useEffect(() => {
    storage?.error?.set(state.error);
  }, [state.error, storage]);

  useEffect(() => {
    storage?.volume?.set(state.volume);
    setStoredValue(STORAGE_KEY.VOLUME, state.volume);
  }, [state.volume, storage]);

  useEffect(() => {
    storage?.playbackRate?.set(state.playbackRate);
    setStoredValue(STORAGE_KEY.PLAYBACK_RATE, state.playbackRate);
  }, [state.playbackRate, storage]);

  useEffect(() => {
    storage?.playbackMode?.set(state.playbackMode);
    setStoredValue(STORAGE_KEY.PLAYBACK_MODE, state.playbackMode);
  }, [state.playbackMode, storage]);

  useEffect(() => {
    storage?.currentIndex?.set(state.currentIndex);
    setStoredValue(STORAGE_KEY.CURRENT_INDEX, state.currentIndex);
  }, [state.currentIndex, storage]);

  useEffect(() => {
    storage?.shuffleOrder?.set(state.shuffleOrder);
  }, [state.shuffleOrder, storage]);

  useEffect(() => {
    storage?.shuffleIndex?.set(state.shuffleIndex);
  }, [state.shuffleIndex, storage]);

  return {
    duration: state.duration,
    currentTime: state.currentTime,
    bufferedRanges: state.bufferedRanges,
    state: state.state,
    error: state.error,
    progress: state.duration ? (state.currentTime / state.duration) * 100 : 0,
    volume: state.volume,
    playbackRate: state.playbackRate,
    playbackMode: state.playbackMode,
    currentTrack,
    currentIndex: state.currentIndex,
    playlist: normalizedPlaylist,
    play,
    pause,
    seek,
    stop,
    setVolume,
    setPlaybackRate,
    setPlaybackMode,
    togglePlaybackMode,
    next,
    previous,
    jumpTo,
    isPending,
  };
}
