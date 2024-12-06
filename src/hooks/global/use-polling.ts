import { useCallback, useEffect, useRef, useState } from "react";

import { createScopedLogger } from "@/utils";

const logger = createScopedLogger("usePolling");

interface UsePollingOptions<T> {
  // Polling interval in milliseconds
  retryDelay?: number;
  // Maximum number of polling attempts, undefined means infinite polling
  maxAttempts?: number;
  // Whether to start polling immediately when component mounts
  immediate?: boolean;
  // Custom function to determine if task is complete
  isComplete?: (data: T) => boolean;
  // Custom function to determine if task has failed
  isFailed?: (data: T) => boolean;
  // Callback when polling succeeds
  onSuccess?: (data: T) => void;
  // Callback when polling fails
  onError?: (error: unknown) => void;
  // Callback when polling finishes (regardless of success/failure)
  onFinish?: () => void;
}

interface UsePollingResult<T> {
  // Current data
  data: T | null;
  // Whether currently polling
  isPolling: boolean;
  // Whether task is complete
  isComplete: boolean;
  // Error if any occurred
  error: unknown;
  // Start polling
  start: (taskId?: string) => void;
  // Stop polling
  stop: () => void;
  // Reset state
  reset: () => void;
}

// Custom error type for polling
class PollingError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "PollingError";
  }
}

export function usePolling<T>(
  // Function to query task status
  queryFn: (taskId?: string) => Promise<T>,
  options: UsePollingOptions<T> = {}
): UsePollingResult<T> {
  const {
    retryDelay = 2000, // Default 2 seconds
    maxAttempts,
    immediate = false,
    isComplete = () => false,
    isFailed = () => false,
    onSuccess,
    onError,
    onFinish,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [taskComplete, setTaskComplete] = useState(false);

  const attemptCount = useRef(0);
  const timeoutId = useRef<NodeJS.Timeout>();
  const taskId = useRef<string>();
  const mounted = useRef(true);
  const isPollingRef = useRef(false);

  const stop = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = undefined;
    }
    isPollingRef.current = false;
    setIsPolling(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setData(null);
    setError(null);
    setTaskComplete(false);
    attemptCount.current = 0;
    taskId.current = undefined;
  }, [stop]);

  const poll = useCallback(async () => {
    if (!mounted.current || !isPollingRef.current) {
      return;
    }

    try {
      const result = await queryFn(taskId.current);

      if (!mounted.current) return;

      setData(result);

      if (isComplete(result)) {
        logger.info("Task completed successfully", { taskId: taskId.current });
        setTaskComplete(true);
        stop();
        onSuccess?.(result);
        onFinish?.();
        return;
      }

      if (isFailed(result)) {
        throw new PollingError("Task failed", result);
      }

      attemptCount.current += 1;

      if (maxAttempts && attemptCount.current >= maxAttempts) {
        throw new PollingError(`Max attempts (${maxAttempts}) reached`);
      }

      if (mounted.current && isPollingRef.current) {
        timeoutId.current = setTimeout(() => {
          if (mounted.current && isPollingRef.current) {
            poll();
          }
        }, retryDelay);
      }
    } catch (err) {
      const error =
        err instanceof PollingError
          ? err
          : new PollingError("Polling failed", err);
      logger.error("Polling error:", {
        error,
        taskId: taskId.current,
        attempt: attemptCount.current,
      });

      if (mounted.current) {
        setError(error);
        stop();
        onError?.(error);
        onFinish?.();
      }
    }
  }, [
    queryFn,
    maxAttempts,
    isComplete,
    isFailed,
    stop,
    onSuccess,
    onError,
    onFinish,
    retryDelay,
  ]);

  const start = useCallback(
    (id?: string) => {
      if (isPollingRef.current) {
        return;
      }

      // Reset all states
      reset();

      taskId.current = id;
      isPollingRef.current = true;
      setIsPolling(true);
      poll();
    },
    [poll, reset]
  );

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = undefined;
      }
      isPollingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (immediate) {
      start();
    }
  }, [immediate, start]);

  return {
    data,
    error,
    isPolling,
    isComplete: taskComplete,
    start,
    stop,
    reset,
  };
}
