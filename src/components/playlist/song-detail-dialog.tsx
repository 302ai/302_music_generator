import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import VideoPlayer from "@/components/video/video-player";
import { mapModelToLabel } from "@/constants/values";
import { useCopyToClipboard } from "@/hooks/global/use-copy-to-clipboard";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { store } from "@/stores";
import {
  currentIndexAtom,
  currentTimeAtom,
  playbackRateAtom,
  playerStateAtom,
} from "@/stores/slices/music_player_store";
import { Track } from "@/stores/slices/playlist_store";
import {
  MediaLoadedMetadataEvent,
  MediaPlayerInstance,
  MediaTimeUpdateEvent,
  MediaTimeUpdateEventDetail,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";
import { useAtomValue } from "jotai";
import {
  Check,
  Copy,
  Download,
  Music,
  Pause,
  Play,
  RefreshCw,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SongDetailDialogProps {
  song: Track;
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate?: () => void;
  onDownloadMp3?: () => void;
  onDownloadMp4?: () => void;
  onTogglePlay?: () => void;
}

export function SongDetailDialog({
  song,
  index,
  open,
  onOpenChange,
  onRegenerate,
  onDownloadMp3,
  onDownloadMp4,
  onTogglePlay,
}: SongDetailDialogProps) {
  const t = useTranslations("home.playlist.song_detail");
  const currentIndex = useAtomValue(currentIndexAtom);
  const playerState = useAtomValue(playerStateAtom);
  const isPlaying = currentIndex === index && playerState === "playing";
  const { isCopied, handleCopy } = useCopyToClipboard({
    text: song.lyrics,
    copyMessage: t("actions.copy_lyrics_success", { title: song.title }),
  });

  const [videoWidth, setVideoWidth] = useState(160);
  const [videoHeight, setVideoHeight] = useState(90);
  const videoRef = useRef<MediaPlayerInstance>(null);
  const remote = useMediaRemote(videoRef);
  const syncLockRef = useRef(false);

  const aspectRatio = useMemo(() => {
    return `${videoWidth}/${videoHeight}`;
  }, [videoWidth, videoHeight]);

  const musicCurrentTime = useAtomValue(currentTimeAtom);
  const musicPlaybackRate = useAtomValue(playbackRateAtom);

  const canPlay = useMediaState("canPlay", videoRef);

  const isCurrentSong = currentIndex === index;

  useEffect(() => {
    if (canPlay && remote) {
      if (isCurrentSong && playerState === "playing") {
        remote.changeVolume(0);
        remote.play();
      } else {
        remote.pause();
      }
    }
  }, [canPlay, remote, isCurrentSong, playerState]);

  useEffect(() => {
    if (remote) {
      remote.changePlaybackRate(musicPlaybackRate);
    }
  }, [musicPlaybackRate, remote]);

  const handleTimeUpdate = useCallback(
    (detail: MediaTimeUpdateEventDetail, nativeEvent: MediaTimeUpdateEvent) => {
      if (!syncLockRef.current && isCurrentSong) {
        syncLockRef.current = true;
        const timeDiff = Math.abs(detail.currentTime - musicCurrentTime);
        if (timeDiff > 0.1) {
          store.set(currentTimeAtom, detail.currentTime);
        }
        setTimeout(() => {
          syncLockRef.current = false;
        }, 50);
      }
    },
    [musicCurrentTime, isCurrentSong]
  );

  const handleLoadedMetadata = useCallback(
    (event: MediaLoadedMetadataEvent) => {
      if (remote && canPlay && isCurrentSong) {
        remote.play();
      }
    },
    [remote, canPlay, isCurrentSong]
  );

  useEffect(() => {
    if (!open && remote) {
      remote.pause();
      remote.seek(0);
    }
  }, [open, remote]);

  useEffect(() => {
    return () => {
      if (remote) {
        remote.pause();
        remote.seek(0);
      }
    };
  }, [remote]);

  const noop = () => {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-4xl p-2 sm:p-6",
          "max-h-[90vh] overflow-y-auto",
          "scrollbar-thin scrollbar-track-transparent",
          "scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20"
        )}
      >
        <DialogHeader className="mb-2 sm:mb-4">
          <DialogTitle className="text-base font-semibold leading-relaxed sm:text-xl">
            {song.title || t("default.title")}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:gap-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
            <div
              className={cn(
                "flex flex-col gap-3",
                "sm:flex-row xl:flex-col",
                "xl:sticky xl:top-0 xl:w-[260px]"
              )}
            >
              <div
                className={cn(
                  "group relative aspect-square",
                  "w-28 sm:w-48 xl:w-full",
                  "mx-auto sm:mx-0",
                  "overflow-hidden rounded-xl"
                )}
              >
                <button
                  onClick={onTogglePlay}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30"
                >
                  {isPlaying ? (
                    <Pause
                      className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      fill="currentColor"
                    />
                  ) : (
                    <Play
                      className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      fill="currentColor"
                    />
                  )}
                </button>
                {song.image_url ? (
                  <>
                    <Image
                      src={song.image_url}
                      alt={song.title || t("image_alt.cover")}
                      fill
                      className={cn(
                        "object-cover opacity-0",
                        "transition-all duration-500 ease-out",
                        "group-hover:scale-110"
                      )}
                      sizes="(max-width: 768px) 128px, 192px"
                      onLoad={(event) => {
                        const img = event.target as HTMLImageElement;
                        img.classList.remove("opacity-0");
                      }}
                      loading="eager"
                    />
                    <Skeleton className="absolute inset-0 animate-pulse" />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/50 text-3xl transition-transform duration-200 group-hover:scale-105 sm:text-4xl">
                    🎵
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 sm:gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      {t("model")}:
                    </span>
                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted/50 sm:text-sm">
                      {mapModelToLabel(song.model) || t("default.model")}
                    </span>
                  </div>
                  {song.duration && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground sm:text-sm">
                        {t("duration")}:
                      </span>
                      <span className="text-xs font-medium sm:text-sm">
                        {formatTime(song.duration)}
                      </span>
                    </div>
                  )}
                </div>

                <p
                  className={cn(
                    "text-xs leading-relaxed sm:text-sm",
                    "line-clamp-3 text-muted-foreground xl:line-clamp-none"
                  )}
                >
                  {song.description || t("default.description")}
                </p>

                <div
                  className={cn(
                    "grid grid-cols-2 gap-2",
                    "sm:flex sm:flex-wrap",
                    "xl:grid xl:grid-cols-1"
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={onRegenerate}
                        className={cn(
                          "h-8 w-full gap-2 text-xs font-medium sm:h-9 sm:w-auto sm:text-sm",
                          "transition-all duration-200",
                          "hover:bg-primary hover:text-primary-foreground",
                          "hover:scale-105 active:scale-95"
                        )}
                      >
                        <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>{t("actions.regenerate")}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("tooltips.regenerate")}</TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-8 w-full gap-2 text-xs font-medium sm:h-9 sm:w-auto sm:text-sm",
                              "transition-all duration-200",
                              "hover:bg-primary hover:text-primary-foreground",
                              "hover:scale-105 active:scale-95"
                            )}
                          >
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>{t("actions.download")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>{t("tooltips.download")}</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="min-w-[140px]">
                      <DropdownMenuItem
                        onClick={onDownloadMp3}
                        className="gap-2 text-xs font-medium transition-colors sm:text-sm"
                      >
                        <Music className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {t("actions.download_mp3")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={onDownloadMp4}
                        className="gap-2 text-xs font-medium transition-colors sm:text-sm"
                      >
                        <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {t("actions.download_mp4")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {song.video_url && (
                <div
                  className={cn(
                    "relative overflow-hidden",
                    "rounded-xl border bg-muted/30",
                    "aspect-video w-full"
                  )}
                >
                  <VideoPlayer
                    ref={videoRef}
                    src={song.video_url}
                    aspectRatio="16/9"
                    currentTime={isCurrentSong ? musicCurrentTime : undefined}
                    onTimeUpdate={isCurrentSong ? handleTimeUpdate : noop}
                    onLoadedMetadata={
                      isCurrentSong ? handleLoadedMetadata : noop
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium sm:text-lg">
                    {t("lyrics")}
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "relative h-8 w-8 p-0",
                          "transition-colors duration-200",
                          "hover:bg-primary/10"
                        )}
                        onClick={handleCopy}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check
                            className={cn(
                              "absolute h-4 w-4 text-green-500",
                              "transition-transform duration-200 ease-in-out",
                              isCopied ? "scale-100" : "scale-0"
                            )}
                          />
                          <Copy
                            className={cn(
                              "absolute h-4 w-4",
                              "transition-transform duration-200 ease-in-out",
                              isCopied ? "scale-0" : "scale-100"
                            )}
                          />
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("tooltips.copy_lyrics")}</TooltipContent>
                  </Tooltip>
                </div>
                <div
                  className={cn(
                    "overflow-y-auto rounded-xl border bg-muted/30",
                    "p-3 sm:p-4",
                    "scrollbar-thin scrollbar-track-transparent",
                    "scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20",
                    "transition-all duration-200 hover:bg-muted/50",
                    song.video_url
                      ? "max-h-[20vh] sm:max-h-[25vh] xl:max-h-[30vh]"
                      : "max-h-[35vh] sm:max-h-[40vh] xl:max-h-[60vh]"
                  )}
                >
                  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm">
                    {song.lyrics || t("default.lyrics")}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
