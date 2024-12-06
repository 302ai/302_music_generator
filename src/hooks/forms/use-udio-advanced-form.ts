"use client";

import {
  UdioAdvancedFormSchema,
  UdioAdvancedFormSchemaType,
} from "@/components/forms/tabs/schema";
import {
  initialUdioAdvanced,
  udioAdvancedAtom,
} from "@/stores/slices/udio_advanced_store";
import { createScopedLogger } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

const useUdioAdvancedForm = () => {
  const [isPending, setIsPending] = useState(false);

  const [storedUdioAdvanced, setStoredUdioAdvanced] = useAtom(udioAdvancedAtom);
  const logger = createScopedLogger("UseUdioAdvancedForm");

  const {
    watch,
    register,
    handleSubmit,
    setValue: setValueForm,
    reset,
    setError,
    formState: { errors },
  } = useForm<UdioAdvancedFormSchemaType>({
    values: storedUdioAdvanced,
    resolver: zodResolver(UdioAdvancedFormSchema),
  });

  const onSubmit = useCallback(
    (data: UdioAdvancedFormSchemaType) => {
      setStoredUdioAdvanced(data);
    },
    [setStoredUdioAdvanced]
  );

  const onGenerate = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const onReset = useCallback(() => {
    reset();
    setStoredUdioAdvanced(initialUdioAdvanced);
  }, [reset, setStoredUdioAdvanced]);

  const setValue = useCallback(
    (name: keyof UdioAdvancedFormSchemaType, value: any) => {
      logger.debug(name, value);
      setValueForm(name, value);
      setStoredUdioAdvanced((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [setValueForm, setStoredUdioAdvanced, logger]
  );

  return {
    isPending,
    setValue,
    onGenerate,
    watch,
    register,
    errors,
    onReset,
  };
};

export default useUdioAdvancedForm;
