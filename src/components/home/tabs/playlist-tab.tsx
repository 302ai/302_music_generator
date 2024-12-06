import { MusicPlayerRef } from "@/components/music/music-player";
import { SongItem } from "@/components/playlist/song-item";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import { store } from "@/stores";
import { editFormAtom } from "@/stores/slices/edit_form_store";
import { findFormByTaskId } from "@/stores/slices/form_history_store";
import {
  currentIndexAtom,
  playerStateAtom,
} from "@/stores/slices/music_player_store";
import { Track, playlistAtom } from "@/stores/slices/playlist_store";
import {
  initialUdioAdvanced,
  udioAdvancedAtom,
} from "@/stores/slices/udio_advanced_store";
import { useAtomValue, useSetAtom } from "jotai";
import { Music } from "lucide-react";
import { useTranslations } from "next-intl";
import { RefObject, useCallback } from "react";
import { toast } from "sonner";

export default function PlaylistTab({
  musicPlayerRef,
}: {
  musicPlayerRef: RefObject<MusicPlayerRef>;
}) {
  const playlist = useAtomValue(playlistAtom);
  const setPlaylist = useSetAtom(playlistAtom);
  const setEditForm = useSetAtom(editFormAtom);
  const setUdioAdvancedForm = useSetAtom(udioAdvancedAtom);
  const { handleDownload } = useMonitorMessage();
  const t = useTranslations("home.playlist");

  const handleContinue = useCallback(
    (song: Track) => {
      toast.info(t("toast.continue", { title: song.title }));
    },
    [t]
  );

  const handleRegenerate = useCallback(
    (song: Track) => {
      toast.info(t("toast.regenerate", { title: song.title }));
      const form = findFormByTaskId(song.task_id);

      setEditForm({
        model: song.model,
        pure: form?.editForm.pure || false,
        custom: true,
        style: song.description || "",
        udioAdvanced: form?.editForm.udioAdvanced || false,
        lyrics: song.lyrics,
        title: song.title,
        musicDescription: song.description || undefined,
      });

      setUdioAdvancedForm({
        promptStrength:
          form?.udioAdvanced.promptStrength ||
          initialUdioAdvanced.promptStrength,
        lyricsStrength:
          form?.udioAdvanced.lyricsStrength ||
          initialUdioAdvanced.lyricsStrength,
        clarityStrength:
          form?.udioAdvanced.clarityStrength ||
          initialUdioAdvanced.clarityStrength,
        quality: form?.udioAdvanced.quality || initialUdioAdvanced.quality,
        negativePrompt:
          form?.udioAdvanced.negativePrompt ||
          initialUdioAdvanced.negativePrompt,
      });
    },
    [setEditForm, setUdioAdvancedForm, t]
  );

  const handleDownloadMp3 = useCallback(
    async (song: Track) => {
      if (!song.audio_url) {
        toast.error(t("toast.no_audio_url", { title: song.title }));
        return;
      }
      const promise = handleDownload(song.audio_url, `${song.title}.mp3`);
      toast.promise(promise, {
        loading: t("toast.downloading_mp3", { title: song.title }),
        success: t("toast.downloaded_mp3", { title: song.title }),
        error: t("toast.download_mp3_failed", { title: song.title }),
      });
      return promise;
    },
    [handleDownload, t]
  );

  const handleDownloadMp4 = useCallback(
    async (song: Track) => {
      if (!song.video_url) {
        toast.error(t("toast.no_video_url", { title: song.title }));
        return;
      }
      const promise = handleDownload(song.video_url, `${song.title}.mp4`);
      toast.promise(promise, {
        loading: t("toast.downloading_mp4", { title: song.title }),
        success: t("toast.downloaded_mp4", { title: song.title }),
        error: t("toast.download_mp4_failed", { title: song.title }),
      });
      return promise;
    },
    [handleDownload, t]
  );

  const handleDelete = useCallback(
    (song: Track) => {
      const newTracks = playlist.tracks.filter((track) => track.id !== song.id);
      setPlaylist({ ...playlist, tracks: newTracks });
      toast.success(t("toast.delete", { title: song.title }));
    },
    [playlist, setPlaylist, t]
  );

  const handleTogglePlay = useCallback(
    (index: number) => {
      const currentIndex = store.get(currentIndexAtom);
      const playerState = store.get(playerStateAtom);
      if (musicPlayerRef.current) {
        if (index === currentIndex && playerState === "playing") {
          musicPlayerRef.current.pause();
        } else if (index === currentIndex && playerState === "paused") {
          musicPlayerRef.current.play();
        } else {
          musicPlayerRef.current.jumpTo(index);
        }
      }
    },
    [musicPlayerRef]
  );

  const handleJumpTo = useCallback(
    (index: number) => {
      musicPlayerRef.current?.jumpTo(index);
    },
    [musicPlayerRef]
  );

  return (
    <div className="flex h-full flex-col gap-4 px-4">
      {playlist.tracks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {playlist.tracks.map((song, index) => (
            <SongItem
              key={song.id}
              song={song}
              index={index}
              togglePlay={() => handleTogglePlay(index)}
              onContinue={() => handleContinue(song)}
              onRegenerate={() => handleRegenerate(song)}
              onDownloadMp3={() => handleDownloadMp3(song)}
              onDownloadMp4={() => handleDownloadMp4(song)}
              onDelete={() => handleDelete(song)}
              onJumpTo={() => handleJumpTo(index)}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Music className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{t("empty.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
