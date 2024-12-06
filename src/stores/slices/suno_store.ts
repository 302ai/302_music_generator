import { SunoMusicData } from "@/services/suno";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export interface SunoState {
  currentTask: SunoMusicData | null;
  taskHistory: SunoMusicData[];
}

const initialSunoState: SunoState = {
  currentTask: null,
  taskHistory: [],
};

export const sunoAtom = atomWithStorage<SunoState>(
  "suno_state",
  initialSunoState,
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
export const setCurrentTaskAtom = atom(
  null,
  (get, set, musicData: SunoMusicData) => {
    set(sunoAtom, (state) => ({
      ...state,
      currentTask: musicData,
    }));
  }
);

export const addSunoTaskToHistoryAtom = atom(
  null,
  (get, set, musicData: SunoMusicData) => {
    set(sunoAtom, (state) => ({
      ...state,
      taskHistory: [...state.taskHistory, musicData],
    }));
  }
);

export const clearTaskHistoryAtom = atom(null, (get, set) => {
  set(sunoAtom, (state) => ({
    ...state,
    taskHistory: [],
  }));
});
