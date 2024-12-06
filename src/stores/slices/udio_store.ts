import { UdioMusicData } from "@/services/udio";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export interface UdioState {
  currentTask: UdioMusicData | null;
  taskHistory: UdioMusicData[];
}

const initialUdioState: UdioState = {
  currentTask: null,
  taskHistory: [],
};

export const udioAtom = atomWithStorage<UdioState>(
  "udio_state",
  initialUdioState,
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

// Actions
export const setCurrentUdioTaskAtom = atom(
  null,
  (get, set, musicData: UdioMusicData) => {
    set(udioAtom, (state) => ({
      ...state,
      currentTask: musicData,
    }));
  }
);

export const addUdioTaskToHistoryAtom = atom(
  null,
  (get, set, musicData: UdioMusicData) => {
    set(udioAtom, (state) => ({
      ...state,
      taskHistory: [...state.taskHistory, musicData],
    }));
  }
);

export const clearUdioTaskHistoryAtom = atom(null, (get, set) => {
  set(udioAtom, (state) => ({
    ...state,
    taskHistory: [],
  }));
});
