"use client";

import { authKy } from "@/api";
import { env } from "@/env";

interface Response {
  data: {
    info: string;
    api_key: string;
    model_name: string;
    region: string;
    settings: {
      hideBrand: boolean;
    };
  };
  code: number;
}

export interface LoginResult {
  success: boolean;
  data?: {
    code: string;
    info: string;
    apiKey: string;
    modelName: string;
    region: string;
    hideBrand: boolean;
  };
}

export const login = async (code?: string): Promise<LoginResult> => {
  const hostname =
    env.NEXT_PUBLIC_DEV_HOST_NAME || window.location.host.split(".")[0];

  const res = await authKy.get(
    `bot/v1/${hostname}${code ? `?pwd=${code}` : ""}`
  );
  let errorMessage = "global.error.unknow_error";

  if (res.status !== 200) {
    errorMessage = "global.error.network_error";
  }

  const data = await res.json<Response>();

  if (data.code === 0) {
    return {
      success: true,
      data: {
        code: code || "",
        info: data.data.info,
        apiKey: data.data.api_key,
        modelName: data.data.model_name || env.NEXT_PUBLIC_DEFAULT_MODEL_NAME,
        region: data.data.region,
        hideBrand: data.data.settings.hideBrand,
      },
    };
  }

  if (data.code === -101) {
    errorMessage = "global.error.tool_deleted";
  } else if (data.code === -100) {
    errorMessage = "global.error.tool_disabled";
  } else if (data.code === -99) {
    errorMessage = "global.error.code_invalid";
  }
  throw new Error(errorMessage);
};
