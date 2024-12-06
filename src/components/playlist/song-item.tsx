import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mapModelToLabel } from "@/constants/values";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  currentIndexAtom,
  playerStateAtom,
} from "@/stores/slices/music_player_store";
import { Track } from "@/stores/slices/playlist_store";
import { useAtomValue } from "jotai";
import {
  ArrowRight,
  Download,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { SongDetailDialog } from "./song-detail-dialog";

interface SongItemProps {
  song: Track;
  index: number;
  togglePlay?: () => void;
  onContinue?: () => void;
  onRegenerate?: () => void;
  onDownloadMp3?: () => void;
  onDownloadMp4?: () => void;
  onDelete?: () => void;
  onJumpTo?: () => void;
  onCopyLyrics?: () => void;
  className?: string;
}

export function SongItem({
  song,
  index,
  togglePlay,
  onContinue,
  onRegenerate,
  onDownloadMp3,
  onDownloadMp4,
  onDelete,
  onJumpTo,
  className,
}: SongItemProps) {
  const currentIndex = useAtomValue(currentIndexAtom);
  const playerState = useAtomValue(playerStateAtom);
  const isPlaying = currentIndex === index && playerState === "playing";
  const t = useTranslations("home.playlist.song_item");
  const [showDetail, setShowDetail] = useState(false);

  const handleRegenerateOnDetail = () => {
    setShowDetail(false);
    onRegenerate?.();
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col gap-3 rounded-lg border bg-card transition-all duration-200 @container/song-item hover:bg-accent/50",
          currentIndex === index && "bg-accent/80",
          className
        )}
      >
        <div className="flex gap-2 p-2 @md:gap-3 @md:p-3">
          <button
            onClick={togglePlay}
            className="group/song-image relative size-14 flex-shrink-0 overflow-hidden rounded-md bg-muted @md:size-16"
          >
            {song.image_url ? (
              <>
                <Image
                  src={song.image_url}
                  alt={song.title || t("image_alt.cover")}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/song-image:opacity-100">
                  {isPlaying ? (
                    <Pause className="size-4 text-white" fill="currentColor" />
                  ) : (
                    <Play className="size-4 text-white" fill="currentColor" />
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg">
                🎵
              </div>
            )}
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 @md:gap-1">
            <div
              className="flex w-fit cursor-pointer flex-col gap-0.5 @md:gap-1"
              onClick={() => setShowDetail(true)}
            >
              <div className="flex w-fit flex-wrap items-center gap-1.5">
                <h3 className="truncate font-medium leading-tight">
                  {song.title || t("default.title")}
                </h3>
                <span className="inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground @md:px-2 @md:text-xs">
                  {mapModelToLabel(song.model) || t("default.model")}
                </span>
              </div>
              <p className="line-clamp-1 w-fit text-xs text-muted-foreground @md:text-sm">
                {song.description || t("default.description")}
              </p>
              {song.duration && (
                <span className="w-fit text-[10px] text-muted-foreground @md:text-xs">
                  {formatTime(song.duration)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 self-center @md:gap-1.5">
            {false && (
              <Button
                variant="outline"
                onClick={onContinue}
                size="sm"
                className="h-7 gap-1 px-1.5 @md:h-8 @md:gap-2 @md:px-2"
              >
                <ArrowRight className="!size-2.5 @md:!size-3" />
                <span className="hidden @sm:inline-block">
                  {t("actions.continue")}
                </span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onRegenerate}
              size="sm"
              className="h-7 gap-1 px-1.5 @md:h-8 @md:gap-2 @md:px-2"
            >
              <RefreshCw className="!size-2.5 @md:!size-3" />
              <span className="hidden @sm:inline-block">
                {t("actions.regenerate")}
              </span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 @md:h-8 @md:w-8"
                >
                  <MoreVertical className="!size-2.5 @md:!size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="">
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full cursor-pointer justify-start gap-2"
                    onClick={onDownloadMp3}
                  >
                    <Download className="h-4 w-4" />
                    {t("actions.download_mp3")}
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full cursor-pointer justify-start gap-2"
                    onClick={onDownloadMp4}
                  >
                    <Download className="h-4 w-4" />
                    {t("actions.download_mp4")}
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full cursor-pointer justify-start gap-2 text-destructive hover:text-destructive focus:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("actions.delete")}
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <SongDetailDialog
        song={song}
        index={index}
        open={showDetail}
        onOpenChange={setShowDetail}
        onRegenerate={handleRegenerateOnDetail}
        onDownloadMp3={onDownloadMp3}
        onDownloadMp4={onDownloadMp4}
        onTogglePlay={togglePlay}
      />
    </>
  );
}
