"use client";

import FormGenerator from "@/components/common/form-generator";
import { LoaderRenderer } from "@/components/common/loader-renderer";
import { Button } from "@/components/ui/button";
import { GLOBAL } from "@/constants";
import useEditForm from "@/hooks/forms/use-edit-form";
import { cn } from "@/lib/utils";
import { generateLyrics } from "@/services/suno";
import { store } from "@/stores";
import { editFormAtom } from "@/stores/slices/edit_form_store";
import { createScopedLogger } from "@/utils";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import UdioAdvancedDialog from "../../home/udio-advanced-dialog";
import { EditFormSchemaType } from "./schema";

const logger = createScopedLogger("EditForm");

export default function EditForm() {
  const t = useTranslations("edit.form");
  const {
    onGenerate,
    onReset,
    register,
    errors,
    watch,
    setValue,
    setError,
    trigger,
    isPending,
  } = useEditForm();

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      onGenerate();
    },
    [onGenerate]
  );

  const [isLyricsGenerating, setIsLyricsGenerating] = useState(false);

  const handleLyricsGenerate = useCallback(() => {
    const lyrics = watch("lyrics");
    if (!lyrics) {
      toast.error(t("lyrics_description_required"));
      setError("lyrics", {
        message: t("lyrics_description_required"),
      });
      return;
    }
    setIsLyricsGenerating(true);
    generateLyrics(lyrics)
      .then((res) => {
        setValue("lyrics", res.data.text);
        const title = watch("title");
        if (!title) {
          setValue("title", res.data.title);
        }
        toast.success(t("lyrics_generate_success"));
      })
      .catch((err) => {
        logger.error("lyrics generate error", err);
        toast.error(t("lyrics_generate_error"));
      })
      .finally(() => {
        setIsLyricsGenerating(false);
      });
  }, [watch, setValue, setError, t]);

  return (
    <form
      className="flex h-full w-full flex-col items-center gap-6 @container"
      onSubmit={handleSubmit}
    >
      <div className="flex w-full flex-col items-start justify-between gap-3 @[368px]:flex-row @[368px]:items-center">
        <div className="w-full @[368px]:w-auto">
          <FormGenerator
            id="model-select"
            name="model"
            inputType="select"
            label=""
            options={GLOBAL.MODEL.SUPPORTED.map((model) => ({
              value: model.value,
              label: model.label,
              id: model.value,
            }))}
            placeholder={t("model_select_placeholder")}
            watch={watch}
            register={register}
            setValue={setValue}
            errors={errors}
            defaultValue={store.get(editFormAtom).model}
          />
        </div>
        <div className="flex w-full flex-shrink-0 items-center justify-between gap-3 @[368px]:w-auto @[368px]:justify-center">
          <FormGenerator
            id="pure-music-switch"
            name="pure"
            inputType="switch"
            label={t("pure_music_label")}
            placeholder=""
            watch={watch}
            register={register}
            setValue={setValue}
            errors={errors}
          />
          <FormGenerator<EditFormSchemaType>
            id="custom-mode-switch"
            name="custom"
            inputType="switch"
            label={t("custom_mode_label")}
            placeholder=""
            watch={watch}
            register={register}
            setValue={setValue}
            errors={errors}
          />
        </div>
      </div>
      <div className={cn("w-full", watch("custom") && "hidden")}>
        <FormGenerator
          id="music-description"
          name="musicDescription"
          inputType="textarea"
          textareaConfig={{
            maxLength: 200,
            showCount: true,
            countPosition: "bottom-right",
            resize: true,
          }}
          label={t("description_label")}
          placeholder={t("description_placeholder")}
          watch={watch}
          register={register}
          setValue={setValue}
          errors={errors}
        />
      </div>
      <div
        className={cn(
          "flex w-full flex-col gap-3 rounded-md",
          // "outline-dashed outline-2 outline-offset-8 outline-foreground/20",
          watch("custom") ? "" : "hidden"
        )}
      >
        {!watch("pure") && (
          <FormGenerator
            id="music-lyrics"
            name="lyrics"
            inputType="textarea"
            textareaConfig={{
              maxLength: 3000,
              showCount: true,
              countPosition: "bottom-right",
              resize: true,
              action: {
                position: "bottom-left",
                label: t("lyrics_action_label"),
                loadingLabel: t("lyrics_action_loading_label"),
                isPending: isLyricsGenerating,
                onClick: handleLyricsGenerate,
              },
            }}
            label={t("lyrics_label")}
            placeholder={t("lyrics_placeholder")}
            watch={watch}
            register={register}
            setValue={setValue}
            errors={errors}
          />
        )}
        <FormGenerator
          id="music-style"
          name="style"
          inputType="textarea"
          textareaConfig={{
            maxLength: 200,
            showCount: true,
            countPosition: "bottom-right",
            wrapperClassName: "h-fit min-h-[92px]",
          }}
          lines={2}
          label={t("style_label")}
          placeholder={t("style_placeholder")}
          watch={watch}
          register={register}
          setValue={setValue}
          errors={errors}
        />
        <FormGenerator
          id="music-title"
          name="title"
          inputType="textarea"
          textareaConfig={{
            maxLength: 80,
            showCount: true,
            countPosition: "bottom-right",
            wrapperClassName: "h-fit min-h-[92px]",
          }}
          lines={1}
          label={t("title_label")}
          placeholder={t("title_placeholder")}
          watch={watch}
          register={register}
          setValue={setValue}
          errors={errors}
          className="min-h-[10px]"
        />
      </div>
      <div
        className={cn(
          "flex w-full justify-start",
          !watch("model").includes("udio") && "hidden"
        )}
      >
        <Button
          variant="outline"
          size="sm"
          type="button"
          className={cn("flex items-center gap-2")}
          onClick={() => {
            setValue("udioAdvanced", !watch("udioAdvanced"));
          }}
        >
          {t("udio_advanced_label")}
        </Button>
      </div>
      <UdioAdvancedDialog
        open={watch("udioAdvanced")}
        onClose={() => setValue("udioAdvanced", false)}
      ></UdioAdvancedDialog>

      <div className="flex w-full justify-end gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={isPending}
        >
          {t("reset_button_label")}
        </Button>
        <Button type="submit" size="sm" className="w-32" disabled={isPending}>
          <LoaderRenderer
            status={isPending ? "loading" : "default"}
            statuses={{
              default: { icon: null, text: t("generate_button_label") },
              loading: {
                icon: <Loader2 className="h-4 w-4 animate-spin" />,
                text: t("generate_loading_button_label"),
              },
            }}
          />
        </Button>
      </div>
    </form>
  );
}
