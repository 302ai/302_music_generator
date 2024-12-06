import { createScopedLogger } from "@/utils";
import saveAs from "file-saver";
import { useCallback } from "react";
const logger = createScopedLogger("MonitorMessage");

interface MonitorMessage {
  from: "monitor";
  eventType: "downloadFile" | "openNewWindow";
  target?: string;
  url: string;
  download?: string;
}

export const useMonitorMessage = () => {
  const sendMonitorMessage = useCallback(
    (message: Omit<MonitorMessage, "from">) => {
      logger.info("sendMonitorMessage", message);
      window.parent.postMessage(
        {
          from: "monitor",
          ...message,
        },
        "*"
      );
    },
    []
  );

  const handleDownload = useCallback(
    async (url: string, filename?: string) => {
      try {
        sendMonitorMessage({
          eventType: "downloadFile",
          url,
          download: filename,
        });

        // Get file content and create blob URL
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        // Trigger download using blob URL
        saveAs(blobUrl, filename || "download");

        // Cleanup
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        logger.error("Failed to download file:", error);
      }
    },
    [sendMonitorMessage]
  );

  const handleNewWindow = useCallback(
    (url: string, target: string = "_blank") => {
      sendMonitorMessage({
        eventType: "openNewWindow",
        url,
        target,
      });
      window.open(url, target);
    },
    [sendMonitorMessage]
  );

  return {
    handleDownload,
    handleNewWindow,
    sendMonitorMessage,
  };
};
