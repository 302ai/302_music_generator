"use client";

import { env } from "@/env";
import useAuth from "@/hooks/auth";
import { usePathname, useRouter } from "@/i18n/routing";
import { appConfigAtom } from "@/stores";
import { createScopedLogger } from "@/utils";
import { isOutsideDeployMode } from "@/utils/302";
import { isAuthPath, needAuth } from "@/utils/path";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

const logger = createScopedLogger("AppAuth");

const AppAuth = () => {
  const router = useRouter();
  const { onAuth } = useAuth();
  const setConfig = useSetAtom(appConfigAtom);

  const pathname = usePathname();

  useEffect(() => {
    if (isOutsideDeployMode()) {
      // Update app configuration from the store with result
      setConfig((prev) => ({ ...prev, apiKey: env.NEXT_PUBLIC_302_API_KEY! }));
      if (isAuthPath(pathname)) {
        router.replace("/");
      }
      return;
    }

    logger.debug("needAuth:", needAuth(pathname));
    // Auto auth for match router
    if (needAuth(pathname)) {
      onAuth();
    }
  }, [onAuth, router, setConfig, pathname]);
  return null;
};

export default AppAuth;
