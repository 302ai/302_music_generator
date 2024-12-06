"use client";

import { FormEvent } from "react";

import FormGenerator from "@/components/common/form-generator";
import { LoaderRenderer } from "@/components/common/loader-renderer";
import { Button } from "@/components/ui/button";
import { FORM_CONSTANTS } from "@/constants";
import useAuth from "@/hooks/auth";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const SignInForm = () => {
  const t = useTranslations();
  const { isPending, setValue, onAuth, watch, register, errors } = useAuth();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onAuth();
  };

  return (
    <form
      className="mt-4 flex w-full max-w-sm flex-col items-center gap-3"
      onSubmit={handleSubmit}
    >
      {FORM_CONSTANTS.signInForm.slice(0, 1).map((field) => {
        return (
          <FormGenerator
            {...field}
            id={field.id}
            key={field.id}
            label={field.label && t(field.label)}
            placeholder={t(field.placeholder ?? "")}
            watch={watch}
            register={register}
            setValue={setValue}
            errors={errors}
            className="w-[220px] text-center"
          />
        );
      })}
      <Button type="submit" className="w-[220px] cursor-pointer rounded-md">
        <LoaderRenderer
          status={isPending ? "loading" : "default"}
          statuses={{
            default: { icon: null, text: t("auth.form.confirm_button") },
            loading: {
              icon: <Loader2 className="h-4 w-4 animate-spin" />,
              text: t("auth.form.confirm_button_loading"),
            },
          }}
        />
      </Button>
      {FORM_CONSTANTS.signInForm.slice(1).map((field) => (
        <FormGenerator
          {...field}
          id={field.id}
          label={t(field.label || "")}
          placeholder={t(field.placeholder || "")}
          key={field.id}
          watch={watch}
          register={register}
          setValue={setValue}
          errors={errors}
          className="w-[220px] text-center"
        />
      ))}
    </form>
  );
};

export default SignInForm;
