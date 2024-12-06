import { useAudioPlayer } from "@/hooks/music/use-audio-player";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { store } from "@/stores";
import {
  bufferedRangesAtom,
  currentIndexAtom,
  currentTimeAtom,
  durationAtom,
  playbackModeAtom,
  playbackRateAtom,
  playerStateAtom,
  shuffleIndexAtom,
  shuffleOrderAtom,
  volumeAtom,
} from "@/stores/slices/music_player_store";
import { playlistAtom } from "@/stores/slices/playlist_store";
import { useAtomValue } from "jotai";
import {
  ChevronLeft,
  ChevronRight,
  Music,
  Pause,
  Play,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { SongDetailDialog } from "../playlist/song-detail-dialog";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface MusicPlayerRef {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  togglePlaybackMode: () => void;
  jumpTo: (index: number) => void;
}

const MusicPlayer = forwardRef<MusicPlayerRef, { className?: string }>(
  ({ className }, ref) => {
    const _playlist = useAtomValue(playlistAtom);
    const t = useTranslations("home.player");

    const playlist = useMemo(
      () =>
        _playlist.tracks
          .filter((track) => track.audio_url !== "")
          .map((track) => ({
            ...track,
            url: track.audio_url ?? "",
            title: track.title ?? "",
          })),
      [_playlist.tracks]
    );
    const {
      state,
      currentIndex,
      duration,
      currentTime,
      volume,
      setVolume,
      seek,
      playbackMode,
      playbackRate,
      setPlaybackRate,
      play,
      pause,
      togglePlaybackMode,
      next,
      previous,
      jumpTo,
    } = useAudioPlayer(playlist, {
      currentIndex: {
        get: () => store.get(currentIndexAtom),
        set: (value) => store.set(currentIndexAtom, value),
      },
      duration: {
        get: () => store.get(durationAtom),
        set: (value) => store.set(durationAtom, value),
      },
      currentTime: {
        get: () => store.get(currentTimeAtom),
        set: (value) => store.set(currentTimeAtom, value),
      },
      bufferedRanges: {
        get: () => store.get(bufferedRangesAtom),
        set: (value) => store.set(bufferedRangesAtom, value),
      },
      state: {
        get: () => store.get(playerStateAtom),
        set: (value) => store.set(playerStateAtom, value),
      },
      volume: {
        get: () => store.get(volumeAtom),
        set: (value) => store.set(volumeAtom, value),
      },
      playbackRate: {
        get: () => store.get(playbackRateAtom),
        set: (value) => store.set(playbackRateAtom, value),
      },
      playbackMode: {
        get: () => store.get(playbackModeAtom),
        set: (value) => store.set(playbackModeAtom, value),
      },
      shuffleOrder: {
        get: () => store.get(shuffleOrderAtom),
        set: (value) => store.set(shuffleOrderAtom, value),
      },
      shuffleIndex: {
        get: () => store.get(shuffleIndexAtom),
        set: (value) => store.set(shuffleIndexAtom, value),
      },
    });

    // Expose control methods to external components
    useImperativeHandle(ref, () => ({
      play,
      pause,
      next,
      previous,
      seek,
      setVolume,
      setPlaybackRate,
      togglePlaybackMode,
      jumpTo,
    }));

    const getPlaybackModeText = () => {
      switch (playbackMode) {
        case "shuffle":
          return t("mode.shuffle");
        case "loop-one":
          return t("mode.loop_one");
        case "loop-all":
          return t("mode.loop_all");
        case "none":
          return t("mode.none");
      }
    };

    const currentTrack = playlist[currentIndex];
    const hasPlaylist = playlist.length > 0;

    // State to control detail dialog
    const [showDetail, setShowDetail] = useState(false);

    // Handle click to open detail
    const handleOpenDetail = () => {
      if (hasPlaylist && currentTrack) {
        setShowDetail(true);
      }
    };

    return (
      <div
        className={cn(
          "flex w-full flex-col bg-background/95 px-2 backdrop-blur-sm sm:border-t sm:px-4",
          className
        )}
      >
        {/* Progress bar for mobile */}
        <div className="w-full sm:hidden">
          <div className="flex w-full items-center py-1.5">
            <Slider
              value={[currentTime]}
              max={duration}
              onValueChange={([value]) => seek(value)}
              className={cn("w-full", !hasPlaylist && "opacity-50")}
              disabled={!hasPlaylist}
            />
          </div>
          <div className="-mt-1 flex justify-between px-0.5">
            <span className="text-[10px] text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Main control area */}
        <div className="flex items-center justify-between gap-2 pt-2 sm:gap-4 sm:pt-4">
          {/* Left: Cover and info */}
          <div className="hidden min-w-[180px] max-w-[240px] items-center gap-3 sm:flex">
            <div
              className={cn(
                "relative size-14 flex-shrink-0 overflow-hidden rounded-md bg-muted",
                hasPlaylist && "cursor-pointer hover:opacity-80"
              )}
              onClick={handleOpenDetail}
            >
              {currentTrack?.image_url ? (
                <Image
                  src={currentTrack.image_url}
                  alt={currentTrack.title || t("image_alt.cover")}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div
              className={cn(
                "flex flex-col gap-1 overflow-hidden",
                hasPlaylist && "cursor-pointer hover:opacity-80"
              )}
              onClick={handleOpenDetail}
            >
              <p className="truncate text-sm font-medium">
                {currentTrack?.title || t("no_track.title")}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {currentTrack?.description || t("no_track.description")}
              </p>
            </div>
          </div>

          {/* Simplified info for mobile */}
          <div
            className={cn(
              "flex items-center gap-2 sm:hidden",
              hasPlaylist ? "cursor-pointer hover:opacity-80" : ""
            )}
            onClick={handleOpenDetail}
          >
            <div className="relative size-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {currentTrack?.image_url ? (
                <Image
                  src={currentTrack.image_url}
                  alt={currentTrack.title || t("image_alt.cover")}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-4 w-4 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <p className="max-w-[120px] truncate text-sm font-medium">
              {currentTrack?.title || t("no_track.title")}
            </p>
          </div>

          {/* Center: Controls and progress */}
          <div className="flex max-w-2xl flex-1 flex-col items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-transform hover:scale-105 sm:h-9 sm:w-9"
                onClick={previous}
                disabled={!hasPlaylist}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full transition-transform hover:scale-105 sm:h-10 sm:w-10"
                onClick={state === "playing" ? pause : play}
                disabled={!hasPlaylist}
              >
                {state === "playing" ? (
                  <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-transform hover:scale-105 sm:h-9 sm:w-9"
                onClick={next}
                disabled={!hasPlaylist}
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            {/* Progress bar for desktop */}
            <div className="hidden w-full items-center gap-2 sm:flex">
              <span className="w-12 text-right text-xs text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration}
                onValueChange={([value]) => seek(value)}
                className="w-full"
              />
              <span className="w-12 text-xs text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Volume, speed and mode controls */}
          <div className="flex min-w-[80px] items-center justify-end gap-0.5 sm:min-w-[180px] sm:gap-2">
            {/* Volume control - hidden on mobile */}
            <div className="hidden sm:block">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-accent"
                    disabled={!hasPlaylist}
                  >
                    {volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" side="top" align="end">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-medium">
                      {Math.round(volume * 100)}%
                    </span>
                    <div className="relative h-24 w-2">
                      <Slider
                        orientation="vertical"
                        value={[volume]}
                        max={1}
                        step={0.01}
                        onValueChange={([value]) => setVolume(value)}
                        className="absolute h-full w-full"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setVolume(volume === 0 ? 1 : 0)}
                    >
                      {volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Playback speed */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-xs font-medium hover:bg-accent sm:h-9 sm:w-9"
                  disabled={!hasPlaylist}
                >
                  {playbackRate}x
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" side="top" align="end">
                <div className="flex flex-col gap-0.5">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <Button
                      key={rate}
                      variant={playbackRate === rate ? "secondary" : "ghost"}
                      size="sm"
                      className="justify-start px-4 text-xs"
                      onClick={() => setPlaybackRate(rate)}
                    >
                      {rate}x
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Playback mode */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={playbackMode !== "none" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 shrink-0 touch-none sm:h-9 sm:w-9"
                    onClick={togglePlaybackMode}
                    disabled={!hasPlaylist}
                  >
                    {playbackMode === "shuffle" && (
                      <Shuffle className="h-4 w-4" />
                    )}
                    {playbackMode === "loop-one" && (
                      <div className="relative">
                        <Repeat className="h-4 w-4" />
                        <span className="absolute -bottom-1 -right-1 text-[10px]">
                          1
                        </span>
                      </div>
                    )}
                    {playbackMode === "loop-all" && (
                      <Repeat className="h-4 w-4" />
                    )}
                    {playbackMode === "none" && (
                      <Repeat className="h-4 w-4 opacity-60" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="px-2 py-1 text-xs"
                  sideOffset={4}
                >
                  {getPlaybackModeText()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* SongDetailDialog */}
        {currentTrack && (
          <SongDetailDialog
            song={currentTrack}
            index={currentIndex}
            open={showDetail}
            onOpenChange={setShowDetail}
            onTogglePlay={() => {
              if (state === "playing") {
                pause();
              } else {
                play();
              }
            }}
          />
        )}
      </div>
    );
  }
);

MusicPlayer.displayName = "MusicPlayer";

export default MusicPlayer;
