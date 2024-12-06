import {
  EditFormSchemaType,
  UdioAdvancedFormSchemaType,
} from "@/components/forms/tabs/schema";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { store } from "..";

export interface FormHistoryItem {
  taskId: string;
  editForm: EditFormSchemaType;
  udioAdvanced: UdioAdvancedFormSchemaType;
}

export interface FormHistoryState {
  history: FormHistoryItem[];
}

const initialFormHistoryState: FormHistoryState = {
  history: [],
};

// Persistent atom
export const formHistoryAtom = atomWithStorage<FormHistoryState>(
  "form_history",
  initialFormHistoryState,
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
export const addFormHistoryAtom = atom(
  null,
  (get, set, item: FormHistoryItem) => {
    set(formHistoryAtom, (state) => ({
      ...state,
      history: [...state.history, item],
    }));
  }
);

export const clearFormHistoryAtom = atom(null, (get, set) => {
  set(formHistoryAtom, (state) => ({
    ...state,
    history: [],
  }));
});

// Find form history by taskId
export const findFormByTaskId = (taskId: string) => {
  const state = store.get(formHistoryAtom);
  return state.history.find((item) => item.taskId === taskId);
};
