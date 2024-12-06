"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { SignInFormType, SignInSchema } from "@/components/forms/auth/schema";
import {
  CHINA_REGION,
  FALSE_STRING,
  SHARE_CODE_REMEMBER_KEY,
  SHARE_CODE_STORE_KEY,
  SHARE_CODE_URL_PARAM,
  TRUE_STRING,
} from "@/constants";
import { env } from "@/env";
import { useRouter } from "@/i18n/routing";
import { login } from "@/services/auth";
import { store } from "@/stores";
import { appConfigAtom } from "@/stores/slices/config_store";
import { logger } from "@/utils";
import { isAuthPath, removeParams } from "@/utils/path";
import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";

const useAuth = () => {
  const [isPending, setIsPending] = useState(false);
  const params = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const setConfig = useSetAtom(appConfigAtom);

  // Initialize form handling with react-hook-form and Zod resolver
  const {
    watch,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SignInFormType>({
    defaultValues: {
      code: "", // Default code to empty string
      remember: true, // Default remember to true
    },
    resolver: zodResolver(SignInSchema),
  });

  // Retrieve values from query param or local storage only when params change
  useEffect(() => {
    const queryCode = params.get(SHARE_CODE_URL_PARAM) || "";
    const sessionCode = store.get(appConfigAtom)?.shareCode || "";
    const storedCode = localStorage.getItem(SHARE_CODE_STORE_KEY) || "";
    const storeRemember = localStorage.getItem(SHARE_CODE_REMEMBER_KEY) || "";

    // Reset remember
    if (storeRemember === FALSE_STRING) {
      setValue("remember", false);
    }

    // Reset code
    if (queryCode || sessionCode || storedCode) {
      setValue("code", queryCode || sessionCode || storedCode);
    }
  }, [params, setValue]);

  // Function to handle authentication
  const performAuth = useCallback(
    async ({ code, remember }: SignInFormType) => {
      try {
        setIsPending(true);

        // Call login function to validate the code
        const result = await login(code);

        logger.debug("Login result:", result);

        // Update app configuration from the store with result
        setConfig((prev) => ({
          ...prev,
          apiKey: result.data?.apiKey,
          modelName: result.data?.modelName,
          isChina: result.data?.region === CHINA_REGION,
          toolInfo: result.data?.info,
          shareCode: result.data?.code,
          hideBrand: result.data?.hideBrand,
        }));

        // Store or remove auth code based on remember flag
        if (remember) {
          localStorage.setItem(SHARE_CODE_REMEMBER_KEY, TRUE_STRING);
          localStorage.setItem(SHARE_CODE_STORE_KEY, code);
        } else {
          localStorage.setItem(SHARE_CODE_REMEMBER_KEY, FALSE_STRING);
          sessionStorage.setItem(SHARE_CODE_STORE_KEY, code);
          localStorage.setItem(SHARE_CODE_STORE_KEY, "");
        }

        // Redirect to the home page if on auth page
        if (isAuthPath(pathname)) {
          replace("/");
        } else {
          removeParams(pathname);
        }
      } catch (error: unknown) {
        // Handle error by navigating to auth and setting error state
        replace(env.NEXT_PUBLIC_AUTH_PATH);
        if (error instanceof Error) {
          setError("code", {
            type: "server",
            message: t(error.message),
          });
        }
      } finally {
        setIsPending(false);
      }
    },
    [t, setError, pathname, replace, setConfig]
  );

  // Callback for form submission
  const onSubmit = useCallback(
    async (data: SignInFormType) => {
      await performAuth(data);
    },
    [performAuth]
  );

  const onAuth = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  return {
    isPending,
    setValue,
    onAuth,
    watch,
    register,
    errors,
  };
};

export default useAuth;
