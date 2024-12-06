import FormGenerator from "@/components/common/form-generator";
import useUdioAdvancedForm from "@/hooks/forms/use-udio-advanced-form";
import { useTranslations } from "next-intl";
import { FormEvent } from "react";

export default function UdioAdvancedForm() {
  const t = useTranslations("edit.form.dialog.udio_advanced");
  const { onGenerate, onReset, register, errors, watch, setValue } =
    useUdioAdvancedForm();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onGenerate();
  };

  return (
    <form
      className="flex h-full w-full flex-col items-center gap-2"
      onSubmit={handleSubmit}
    >
      <FormGenerator
        id="promptStrength"
        inputType="slider"
        name="promptStrength"
        label={t("prompt_strength_label")}
        sliderConfig={{
          min: 0,
          max: 1,
          step: 0.1,
          showMinLabel: true,
          showMaxLabel: true,
          minLabel: {
            top: "0%",
            bottom: t("low"),
          },
          maxLabel: {
            top: "100%",
            bottom: t("high"),
          },
          tooltip: t("prompt_strength_tooltip"),
          showCurrentValue: true,
          formatValue: (value) => `${value * 100}%`,
        }}
        watch={watch}
        register={register}
        setValue={setValue}
        errors={errors}
      />

      <FormGenerator
        id="lyricsStrength"
        inputType="slider"
        name="lyricsStrength"
        label={t("lyrics_strength_label")}
        sliderConfig={{
          min: 0,
          max: 1,
          step: 0.1,
          showMinLabel: true,
          showMaxLabel: true,
          minLabel: {
            top: "0%",
            bottom: t("low"),
          },
          maxLabel: {
            top: "100%",
            bottom: t("high"),
          },
          tooltip: t("lyrics_strength_tooltip"),
          showCurrentValue: true,
          formatValue: (value) => `${value * 100}%`,
        }}
        watch={watch}
        register={register}
        setValue={setValue}
        errors={errors}
      />

      <FormGenerator
        id="clarityStrength"
        inputType="slider"
        name="clarityStrength"
        label={t("clarity_label")}
        sliderConfig={{
          min: 0,
          max: 1,
          step: 0.1,
          showMinLabel: true,
          showMaxLabel: true,
          minLabel: {
            top: "0%",
            bottom: t("low"),
          },
          maxLabel: {
            top: "100%",
            bottom: t("high"),
          },
          tooltip: t("clarity_tooltip"),
          showCurrentValue: true,
          formatValue: (value) => `${value * 100}%`,
        }}
        watch={watch}
        register={register}
        setValue={setValue}
        errors={errors}
      />

      <div className="w-full">
        <FormGenerator
          id="negativePrompt"
          name="negativePrompt"
          inputType="textarea"
          textareaConfig={{
            maxLength: 200,
            showCount: true,
            countPosition: "bottom-right",
            resize: true,
            tooltip: t("negative_prompt_tooltip"),
            wrapperClassName: "h-fit min-h-[92px]",
          }}
          label={t("negative_prompt_label")}
          placeholder={t("negative_prompt_placeholder")}
          watch={watch}
          register={register}
          setValue={setValue}
          errors={errors}
        />
      </div>

      <FormGenerator
        id="quality"
        inputType="slider"
        name="quality"
        label={t("quality_label")}
        sliderConfig={{
          min: 0.25,
          max: 1,
          step: 0.25,
          stepLabels: [
            { value: 0.25, topLabel: t("worse"), bottomLabel: t("faster") },
            { value: 0.5, topLabel: t("average") },
            { value: 0.75, topLabel: t("better") },
            { value: 1, topLabel: t("best"), bottomLabel: t("slower") },
          ],
          tooltip: t("quality_tooltip"),
        }}
        watch={watch}
        register={register}
        setValue={setValue}
        errors={errors}
      />
    </form>
  );
}
