import { EditFormSchemaType } from "@/components/forms/tabs/schema";
import { GLOBAL } from "@/constants";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export const initialEditForm: EditFormSchemaType = {
  model: GLOBAL.MODEL.DEFAULT,
  pure: false,
  custom: false,
  udioAdvanced: false,
  musicDescription: "",
  lyrics: "",
  style: "",
  title: "",
};

export const editFormAtom = atomWithStorage<EditFormSchemaType>(
  "editForm",
  initialEditForm,
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
