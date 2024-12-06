"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { store } from "@/stores";
import {
  currentTimeAtom,
  playbackRateAtom,
  playerStateAtom,
  volumeAtom,
} from "@/stores/slices/music_player_store";
import { createScopedLogger } from "@/utils";
import {
  isHTMLVideoElement,
  MediaLoadedMetadataEvent,
  MediaPlayerInstance,
  MediaTimeUpdateEvent,
  MediaTimeUpdateEventDetail,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";
import { useAtomValue } from "jotai";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import VideoPlayer from "./video-player";

interface PictureInPictureVideoProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
}

const MIN_WIDTH = 320;
const MAX_WIDTH = 1200;
const TITLE_BAR_HEIGHT = 32;

const logger = createScopedLogger("PictureInPictureVideo");

// Define resize direction types
type ResizeDirection = "e" | "w" | "s" | "se" | "sw";

export function PictureInPictureVideo({
  src,
  isOpen,
  onClose,
}: PictureInPictureVideoProps) {
  const t = useTranslations("home.video");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({
    width: MIN_WIDTH,
    height: (MIN_WIDTH * 9) / 16 + TITLE_BAR_HEIGHT,
  });
  const aspectRatioRef = useRef(16 / 9);
  const videoRef = useRef<MediaPlayerInstance>(null);
  const remote = useMediaRemote(videoRef);
  const isDragging = useRef(false);
  const isResizing = useRef<ResizeDirection | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });
  const hasLoadedRef = useRef(false);
  const lastSizeRef = useRef({
    width: MIN_WIDTH,
    height: (MIN_WIDTH * 9) / 16 + TITLE_BAR_HEIGHT,
  });

  const [videoWidth, setVideoWidth] = useState(MIN_WIDTH);
  const [videoHeight, setVideoHeight] = useState(
    (MIN_WIDTH * 9) / 16 + TITLE_BAR_HEIGHT
  );

  const aspectRatio = useMemo(() => {
    return `${videoWidth}/${videoHeight}`;
  }, [videoWidth, videoHeight]);

  const handleVideoLoad = useCallback(
    (nativeEvent: MediaLoadedMetadataEvent) => {
      if (!hasLoadedRef.current) {
        const target = nativeEvent.trigger?.target;
        if (isHTMLVideoElement(target)) {
          const element = target; // `HTMLVideoElement`
          logger.info("video loaded", element.videoWidth, element.videoHeight);
          setVideoWidth(element.videoWidth);
          setVideoHeight(element.videoHeight);
          const videoAspectRatio = element.videoWidth / element.videoHeight;
          aspectRatioRef.current = videoAspectRatio;
          const newSize = {
            width: lastSizeRef.current.width,
            height:
              lastSizeRef.current.width / videoAspectRatio + TITLE_BAR_HEIGHT,
          };
          setSize(newSize);
          lastSizeRef.current = newSize;
          hasLoadedRef.current = true;
        }
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      hasLoadedRef.current = false;
      setSize(lastSizeRef.current);
    }
  }, [isOpen]);

  const handleResizeStart =
    (direction: ResizeDirection) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = direction;
      resizeStart.current = {
        width: size.width,
        height: size.height,
        x: e.clientX,
        y: e.clientY,
      };
    };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        dragStart.current = { x: e.clientX, y: e.clientY };
      }

      if (isResizing.current) {
        e.preventDefault();
        e.stopPropagation();

        const direction = isResizing.current;
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;

        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = position.x;
        let shouldUpdatePosition = false;

        switch (direction) {
          case "e":
            newWidth = Math.min(
              Math.max(MIN_WIDTH, resizeStart.current.width + dx),
              MAX_WIDTH
            );
            newHeight = newWidth / aspectRatioRef.current + TITLE_BAR_HEIGHT;
            break;
          case "w":
            const proposedWidth = resizeStart.current.width - dx;
            const clampedWidth = Math.min(
              Math.max(MIN_WIDTH, proposedWidth),
              MAX_WIDTH
            );
            // Calculate actual dx (considering min/max width limits)
            const actualDx = resizeStart.current.width - clampedWidth;
            newWidth = clampedWidth;
            newHeight = newWidth / aspectRatioRef.current + TITLE_BAR_HEIGHT;
            // Update x position using actual dx
            newX = resizeStart.current.x + actualDx;
            shouldUpdatePosition = true;
            break;
          case "s":
            newHeight = Math.max(
              MIN_WIDTH / aspectRatioRef.current + TITLE_BAR_HEIGHT,
              resizeStart.current.height + dy
            );
            newWidth = (newHeight - TITLE_BAR_HEIGHT) * aspectRatioRef.current;
            if (newWidth > MAX_WIDTH) {
              newWidth = MAX_WIDTH;
              newHeight = newWidth / aspectRatioRef.current + TITLE_BAR_HEIGHT;
            }
            break;
          case "se":
            newWidth = Math.min(
              Math.max(MIN_WIDTH, resizeStart.current.width + dx),
              MAX_WIDTH
            );
            newHeight = newWidth / aspectRatioRef.current + TITLE_BAR_HEIGHT;
            break;
          case "sw":
            const proposedWidthSW = resizeStart.current.width - dx;
            const clampedWidthSW = Math.min(
              Math.max(MIN_WIDTH, proposedWidthSW),
              MAX_WIDTH
            );
            // Calculate actual dx (considering min/max width limits)
            const actualDxSW = resizeStart.current.width - clampedWidthSW;
            newWidth = clampedWidthSW;
            newHeight = newWidth / aspectRatioRef.current + TITLE_BAR_HEIGHT;
            // Update x position using actual dx
            newX = resizeStart.current.x + actualDxSW;
            shouldUpdatePosition = true;
            break;
        }

        setSize({ width: newWidth, height: newHeight });
        if (shouldUpdatePosition) {
          setPosition((prev) => ({ ...prev, x: newX }));
        }
        lastSizeRef.current = { width: newWidth, height: newHeight };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing.current) {
        e.preventDefault();
        e.stopPropagation();
      }
      isDragging.current = false;
      isResizing.current = null;
      // Only update start position for directions that affect x position
      if (isResizing.current === "w" || isResizing.current === "sw") {
        resizeStart.current.x = position.x;
      }
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp, { passive: false });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const musicCurrentTime = useAtomValue(currentTimeAtom);
  const musicVolume = useAtomValue(volumeAtom);
  const musicPlayerState = useAtomValue(playerStateAtom);
  const musicPlaybackRate = useAtomValue(playbackRateAtom);

  const canPlay = useMediaState("canPlay", videoRef);

  // Sync music player state to video
  useEffect(() => {
    if (remote && canPlay) {
      if (musicPlayerState === "playing") {
        remote.play();
      } else {
        remote.changeVolume(musicVolume);
        remote.pause();
      }
    }
  }, [musicPlayerState, remote, canPlay, musicVolume]);

  // Start playing video when ready if music is playing
  useEffect(() => {
    if (canPlay && remote && musicPlayerState === "playing") {
      remote.changeVolume(0);
      remote.play();
    }
  }, [canPlay, remote, musicPlayerState]);

  useEffect(() => {
    if (remote) {
      remote.changeVolume(0);
    }
  }, [remote]);

  // Sync playback speed
  useEffect(() => {
    if (remote) {
      remote.changePlaybackRate(musicPlaybackRate);
    }
  }, [musicPlaybackRate, remote]);

  // Add sync lock flag
  const syncLockRef = useRef(false);

  // Sync music player progress to video
  useEffect(() => {
    if (remote && !syncLockRef.current) {
      syncLockRef.current = true;
      remote.seek(musicCurrentTime);
      // Release lock after short delay
      setTimeout(() => {
        syncLockRef.current = false;
      }, 50);
    }
  }, [musicCurrentTime, remote]);

  const handleTimeUpdate = useCallback(
    (detail: MediaTimeUpdateEventDetail, nativeEvent: MediaTimeUpdateEvent) => {
      // Prevent sync loops
      if (!syncLockRef.current) {
        syncLockRef.current = true;

        // Only sync when time difference exceeds threshold
        const timeDiff = Math.abs(detail.currentTime - musicCurrentTime);
        if (timeDiff > 0.1) {
          store.set(currentTimeAtom, detail.currentTime);
        }

        // Release lock after short delay
        setTimeout(() => {
          syncLockRef.current = false;
        }, 50);
      }
    },
    [musicCurrentTime]
  );

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 overflow-hidden",
        "rounded-lg shadow-[0_0_24px_rgba(0,0,0,0.15)]",
        "border border-border/50 bg-card/95 backdrop-blur-sm"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      {/* Drag area */}
      <div
        className={cn(
          "flex h-8 items-center justify-between px-3",
          "bg-gradient-to-b from-background/80 to-background/60",
          "border-b border-border/50",
          "cursor-move select-none"
        )}
        style={{ height: `${TITLE_BAR_HEIGHT}px` }}
        onMouseDown={(e) => {
          e.preventDefault();
          isDragging.current = true;
          dragStart.current = { x: e.clientX, y: e.clientY };
        }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-foreground/50" />
          <div className="text-xs font-medium text-foreground/80">
            {t("title")}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 rounded-full p-0 hover:bg-foreground/10"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Video player container */}
      <div
        className="relative w-full bg-black"
        style={{ height: `calc(100% - ${TITLE_BAR_HEIGHT}px)` }}
      >
        <VideoPlayer
          ref={videoRef}
          src={src}
          aspectRatio={aspectRatio}
          onLoadedMetadata={handleVideoLoad}
          currentTime={musicCurrentTime}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      {/* Resize handle */}
      <div
        className={cn(
          "group absolute bottom-0 right-0 z-50",
          "h-4 w-4 cursor-se-resize",
          "transition-colors hover:bg-foreground/5"
        )}
        onMouseDown={handleResizeStart("se")}
      >
        <div className="absolute bottom-0 right-0 overflow-hidden">
          <div className="absolute bottom-[3px] right-[3px] h-[1px] w-3 bg-border/50" />
          <div className="absolute bottom-[3px] right-[3px] h-3 w-[1px] bg-border/50" />
        </div>
      </div>

      {/* Left resize handle */}
      <div
        className="absolute bottom-8 left-0 top-8 z-50 w-1 cursor-w-resize hover:bg-foreground/5"
        onMouseDown={handleResizeStart("w")}
      />

      {/* Right resize handle */}
      <div
        className="absolute bottom-8 right-0 top-8 z-50 w-1 cursor-e-resize hover:bg-foreground/5"
        onMouseDown={handleResizeStart("e")}
      />

      {/* Bottom resize handle */}
      <div
        className="absolute bottom-0 left-4 right-4 z-50 h-1 cursor-s-resize hover:bg-foreground/5"
        onMouseDown={handleResizeStart("s")}
      />

      {/* Bottom left resize handle */}
      <div
        className={cn(
          "absolute bottom-0 left-0 z-50",
          "h-4 w-4 cursor-sw-resize",
          "transition-colors hover:bg-foreground/5"
        )}
        onMouseDown={handleResizeStart("sw")}
      >
        <div className="absolute bottom-0 left-0 overflow-hidden">
          <div className="absolute bottom-[3px] left-[3px] h-[1px] w-3 bg-border/50" />
          <div className="absolute bottom-[3px] left-[3px] h-3 w-[1px] bg-border/50" />
        </div>
      </div>
    </div>
  );
}
