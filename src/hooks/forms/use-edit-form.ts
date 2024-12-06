"use client";

import {
  EditFormSchema,
  EditFormSchemaType,
} from "@/components/forms/tabs/schema";
import { generateMusicStyles } from "@/services/chat";
import {
  isSunoTaskComplete,
  querySunoTaskStatus,
  submitSunoMusic,
} from "@/services/suno";
import {
  isUdioTaskComplete,
  queryUdioTaskStatus,
  submitUdioMusic,
} from "@/services/udio";
import { store } from "@/stores";
import { editFormAtom, initialEditForm } from "@/stores/slices/edit_form_store";
import { addFormHistoryAtom } from "@/stores/slices/form_history_store";
import {
  addTrackAtom,
  mapSunoMusicDataToTrack,
  mapUdioMusicDataToTrack,
} from "@/stores/slices/playlist_store";
import { addSunoTaskToHistoryAtom } from "@/stores/slices/suno_store";
import { udioAdvancedAtom } from "@/stores/slices/udio_advanced_store";
import { addUdioTaskToHistoryAtom } from "@/stores/slices/udio_store";
import { createScopedLogger } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mutex } from "async-mutex";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { usePolling } from "../global/use-polling";

const logger = createScopedLogger("UseEditForm");

const POLLING_STORAGE_KEY = "polling_task";
// Create global mutex instance
const pollingMutex = new Mutex();
// Add global initialization flag
let isGlobalInitialized = false;

const useEditForm = () => {
  const pollingStartedRef = useRef(false);
  const initializedRef = useRef(false);

  const [isPending, setIsPending] = useState(() => {
    const stored = localStorage.getItem(POLLING_STORAGE_KEY);
    return !!stored;
  });
  const [storedForm, setStoredForm] = useAtom(editFormAtom);
  const t = useTranslations("edit.form");
  const {
    watch,
    register,
    handleSubmit,
    setValue: setValueForm,
    reset,
    setError,
    trigger,
    formState: { errors },
  } = useForm<EditFormSchemaType>({
    values: storedForm,
    resolver: zodResolver(EditFormSchema, {
      errorMap: (error, ctx) => {
        logger.debug("Zod error:", error, ctx);
        return { message: error.message || "Validation error" };
      },
    }),
    mode: "onSubmit",
    criteriaMode: "all",
    defaultValues: initialEditForm,
  });

  const { isPolling: isPollingSunoMusic, start: startPollingSunoMusic } =
    usePolling(querySunoTaskStatus, {
      retryDelay: 60000,
      maxAttempts: 30,
      isComplete: isSunoTaskComplete,
      onSuccess: (data) => {
        logger.debug("Suno music task completed:", data);
        setIsPending(false);
        localStorage.removeItem(POLLING_STORAGE_KEY);
        pollingStartedRef.current = false;

        // Add to task list
        store.set(addSunoTaskToHistoryAtom, data.data.data[0]);
        store.set(addSunoTaskToHistoryAtom, data.data.data[1]);

        if (
          (!data.data.data[0].prompt && !data.data.data[0].title) ||
          (!data.data.data[1].prompt && !data.data.data[1].title)
        )
          return;

        // Add to playlist
        toast.promise(
          generateMusicStyles(
            data.data.data[0].prompt || data.data.data[0].title || ""
          )
            .then((res) => {
              store.set(
                addTrackAtom,
                mapSunoMusicDataToTrack(
                  data.data.data[0],
                  data.data.data[0].mv || "",
                  res.styles.join(", ")
                )
              );
              return res;
            })
            .catch((error) => {
              logger.error(
                "Error generating music styles for Suno track 1:",
                error
              );
              store.set(
                addTrackAtom,
                mapSunoMusicDataToTrack(
                  data.data.data[0],
                  data.data.data[0].mv || "",
                  data.data.data[0].prompt || data.data.data[0].title || ""
                )
              );
              throw error;
            }),
          {
            loading: t("loading.generating_styles_1"),
            success: t("success.styles_generated_1"),
            error: t("errors.styles_generation_failed_1"),
          }
        );

        toast.promise(
          generateMusicStyles(
            data.data.data[1].prompt || data.data.data[1].title || ""
          )
            .then((res) => {
              store.set(
                addTrackAtom,
                mapSunoMusicDataToTrack(
                  data.data.data[1],
                  data.data.data[1].mv || "",
                  res.styles.join(", ")
                )
              );
              return res;
            })
            .catch((error) => {
              logger.error(
                "Error generating music styles for Suno track 2:",
                error
              );
              store.set(
                addTrackAtom,
                mapSunoMusicDataToTrack(
                  data.data.data[1],
                  data.data.data[1].mv || "",
                  data.data.data[1].prompt || data.data.data[1].title || ""
                )
              );
              throw error;
            }),
          {
            loading: t("loading.generating_styles_2"),
            success: t("success.styles_generated_2"),
            error: t("errors.styles_generation_failed_2"),
          }
        );

        // Add success toast
        toast.success(t("success.suno_generated"));
      },
      onError: (error) => {
        logger.error("Error polling suno music:", error);
        setIsPending(false);
        localStorage.removeItem(POLLING_STORAGE_KEY);
        pollingStartedRef.current = false;
        toast.error(t("errors.polling_failed"));
      },
    });

  const { isPolling: isPollingUdioMusic, start: startPollingUdioMusic } =
    usePolling(queryUdioTaskStatus, {
      retryDelay: 60000,
      maxAttempts: 30,
      isComplete: isUdioTaskComplete,
      onSuccess: (data) => {
        logger.debug("Udio music task completed:", data);
        setIsPending(false);
        const storedTask = localStorage.getItem(POLLING_STORAGE_KEY);
        const { type } = JSON.parse(storedTask || "{ type: 'udio' }");
        localStorage.removeItem(POLLING_STORAGE_KEY);
        pollingStartedRef.current = false;

        const song01 = data.data?.data?.[0]?.songs?.[0];
        if (!song01 || (!song01.lyrics && !song01.title)) return;
        // Add to task list
        store.set(addUdioTaskToHistoryAtom, song01);
        // Add to playlist
        toast.promise(
          generateMusicStyles(song01.lyrics || song01.title || "")
            .then((res) => {
              store.set(
                addTrackAtom,
                mapUdioMusicDataToTrack(song01, type, res.styles.join(", "))
              );
              return res;
            })
            .catch((error) => {
              logger.error(
                "Error generating music styles for Udio track 1:",
                error
              );
              store.set(
                addTrackAtom,
                mapUdioMusicDataToTrack(
                  song01,
                  type,
                  song01.lyrics || song01.title || ""
                )
              );
              throw error;
            }),
          {
            loading: t("loading.generating_styles_1"),
            success: t("success.styles_generated_1"),
            error: t("errors.styles_generation_failed_1"),
          }
        );

        const song02 = data.data?.data?.[1]?.songs?.[0];
        if (!song02 || (!song02.lyrics && !song02.title)) return;
        // Add to task list
        store.set(addUdioTaskToHistoryAtom, song02);
        // Add to playlist
        toast.promise(
          generateMusicStyles(song02.lyrics || song02.title || "")
            .then((res) => {
              store.set(
                addTrackAtom,
                mapUdioMusicDataToTrack(song02, type, res.styles.join(", "))
              );
              return res;
            })
            .catch((error) => {
              logger.error(
                "Error generating music styles for Udio track 2:",
                error
              );
              store.set(
                addTrackAtom,
                mapUdioMusicDataToTrack(
                  song02,
                  type,
                  song02.lyrics || song02.title || ""
                )
              );
              throw error;
            }),
          {
            loading: t("loading.generating_styles_2"),
            success: t("success.styles_generated_2"),
            error: t("errors.styles_generation_failed_2"),
          }
        );

        // Add success toast
        toast.success(t("success.udio_generated"));
      },
      onError: (error) => {
        logger.error("Error polling udio music:", error);
        setIsPending(false);
        localStorage.removeItem(POLLING_STORAGE_KEY);
        pollingStartedRef.current = false;
        toast.error(t("errors.polling_failed"));
      },
    });

  useLayoutEffect(() => {
    // Check global initialization status
    if (!isGlobalInitialized && !initializedRef.current) {
      isGlobalInitialized = true;
      initializedRef.current = true;

      if (!isPollingSunoMusic && !isPollingUdioMusic) {
        (async () => {
          const release = await pollingMutex.acquire();
          try {
            pollingStartedRef.current = true;

            const storedTask = localStorage.getItem(POLLING_STORAGE_KEY);
            if (storedTask) {
              try {
                const { type, data } = JSON.parse(storedTask);
                if (type.includes("udio")) {
                  startPollingUdioMusic(data);
                  toast.success(t("success.resuming_udio_task"));
                } else {
                  startPollingSunoMusic(data);
                  toast.success(t("success.resuming_suno_task"));
                }
              } catch (error) {
                pollingStartedRef.current = false;
                localStorage.removeItem(POLLING_STORAGE_KEY);
              }
            } else {
              pollingStartedRef.current = false;
            }
          } finally {
            release();
          }
        })();
      }
    }
  }, [
    startPollingSunoMusic,
    startPollingUdioMusic,
    isPollingSunoMusic,
    isPollingUdioMusic,
    t,
  ]);

  const onGenerate = useCallback(async () => {
    const formData = watch();
    logger.debug("Current form data:", formData);

    try {
      // Manually validate data
      const validationResult = EditFormSchema.safeParse(formData);

      if (!validationResult.success) {
        const formattedErrors = validationResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        }));
        logger.debug(
          "Formatted validation errors:",
          JSON.stringify(formattedErrors, null, 2)
        );

        // Set errors
        formattedErrors.forEach((error) => {
          const field = error.path[error.path.length - 1];
          if (typeof field === "string") {
            setError(field as keyof EditFormSchemaType, {
              type: "custom",
              message: t(`errors.${error.message}`),
            });
          }
        });

        // Focus on first error
        if (formattedErrors.length > 0) {
          const firstError = formattedErrors[0];
          const firstErrorField = firstError.path[firstError.path.length - 1];
          if (typeof firstErrorField === "string") {
            const errorElement = document.querySelector(
              `[name="${firstErrorField}"]`
            );
            logger.debug("First error field:", firstErrorField);
            if (errorElement instanceof HTMLElement) {
              errorElement.focus();
            }
          }
        }
        return;
      }

      if (isPollingSunoMusic || isPollingUdioMusic) {
        logger.debug("Already polling, skipping...");
        return;
      }

      setIsPending(true);
      if (formData.model.includes("udio")) {
        const release = await pollingMutex.acquire();
        try {
          logger.debug("Submitting udio music...");
          const res = await submitUdioMusic(formData);
          localStorage.setItem(
            POLLING_STORAGE_KEY,
            JSON.stringify({
              type: formData.model,
              data: res.data,
            })
          );
          pollingStartedRef.current = true;
          // Store current form in history
          store.set(addFormHistoryAtom, {
            taskId: res.data,
            editForm: formData,
            udioAdvanced: store.get(udioAdvancedAtom),
          });
          startPollingUdioMusic(res.data);
          toast.success(t("success.submitting_udio_task"));
        } finally {
          release();
        }
      } else {
        const release = await pollingMutex.acquire();
        try {
          logger.debug("Submitting suno music...");
          const res = await submitSunoMusic(formData);

          localStorage.setItem(
            POLLING_STORAGE_KEY,
            JSON.stringify({
              type: formData.model,
              data: res.data,
            })
          );
          pollingStartedRef.current = true;
          // Store current form in history
          store.set(addFormHistoryAtom, {
            taskId: res.data,
            editForm: formData,
            udioAdvanced: store.get(udioAdvancedAtom),
          });
          startPollingSunoMusic(res.data);
          toast.success(t("success.submitting_suno_task"));
        } finally {
          release();
        }
      }
    } catch (error) {
      logger.error("Validation error:", error);
      setIsPending(false);
      pollingStartedRef.current = false;

      if (formData.model.includes("udio")) {
        toast.error(t("errors.udio_submit_failed"));
      } else {
        toast.error(t("errors.suno_submit_failed"));
      }
    }
  }, [
    watch,
    setError,
    t,
    isPollingSunoMusic,
    isPollingUdioMusic,
    startPollingSunoMusic,
    startPollingUdioMusic,
  ]);

  const onReset = useCallback(() => {
    reset();
    setStoredForm(initialEditForm);
  }, [reset, setStoredForm]);

  const setValue = useCallback(
    (name: keyof EditFormSchemaType, value: any) => {
      logger.debug(name, value);
      setValueForm(name, value);
      setStoredForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [setValueForm, setStoredForm]
  );

  return {
    isPending,
    setValue,
    onGenerate,
    watch,
    register,
    errors,
    onReset,
    setError,
    trigger,
  };
};

export default useEditForm;
