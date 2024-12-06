"use client";

import HomeHeader from "@/components/home/header";
import EditorTab from "@/components/home/tabs/editor-tab";
import PlaylistTab from "@/components/home/tabs/playlist-tab";
import MusicPlayer, { MusicPlayerRef } from "@/components/music/music-player";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PictureInPictureVideo } from "@/components/video/picture-in-picture-video";
import TabVideo from "@/components/video/tab-video";
import { cn } from "@/lib/utils";
import { currentIndexAtom } from "@/stores/slices/music_player_store";
import { playlistAtom } from "@/stores/slices/playlist_store";
import { createScopedLogger } from "@/utils/logger";
import { useAtomValue } from "jotai";
import { Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const logger = createScopedLogger("Home");

export default function Home() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const musicPlayerRef = useRef<MusicPlayerRef>(null);
  const t = useTranslations("home");
  useEffect(() => {
    logger.info("Hello, Welcome to 302.AI");
  }, []);

  const currentIndex = useAtomValue(currentIndexAtom);
  const playlist = useAtomValue(playlistAtom);

  const currentSong = useMemo(
    () => playlist.tracks[currentIndex],
    [playlist, currentIndex]
  );

  const handleOpenVideo = () => {
    if (!currentSong) {
      toast.error(t("video.error.no_current_song"));
      return;
    }
    if (!currentSong.video_url) {
      toast.error(t("video.error.no_video"));
      return;
    }
    setIsVideoOpen(true);
  };

  return (
    <div className="container relative mx-auto mt-10 flex h-[calc(100vh-theme(spacing.10))] min-w-[375px] flex-1 flex-col items-center gap-4 overflow-auto rounded-lg border bg-background p-4 pb-0 shadow-sm lg:max-w-[1280px]">
      <HomeHeader />

      {/* Video play button - only shown on medium and large screens */}
      <div className="w-full">
        <div className="hidden min-h-[32px] justify-end md:flex">
          {currentSong?.video_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenVideo}
              className="flex items-center gap-2"
            >
              <Video className="h-4 w-4" />
              {t("video.open")}
            </Button>
          )}
        </div>
      </div>
      {/* Two-column layout for large screens */}
      <ResizablePanelGroup
        direction="horizontal"
        className="!hidden h-full flex-1 md:!flex"
      >
        <ResizablePanel
          className="h-full min-w-[300px] !overflow-y-auto pt-1"
          defaultSize={40}
        >
          <EditorTab />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="h-full min-w-[430px] !overflow-y-auto pt-1">
          <PlaylistTab musicPlayerRef={musicPlayerRef} />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Tab switching layout for small screens */}
      <Tabs defaultValue="editor" className="w-full flex-1 md:hidden">
        <TabsList
          className={cn(
            "grid w-full",
            currentSong?.video_url ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          <TabsTrigger value="editor">{t("tabs.editor")}</TabsTrigger>
          <TabsTrigger value="playlist">{t("tabs.playlist")}</TabsTrigger>
          {currentSong?.video_url && (
            <TabsTrigger value="video">{t("tabs.video")}</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="editor" className="mt-4">
          <EditorTab />
        </TabsContent>
        <TabsContent value="playlist" className="mt-4 h-full">
          <PlaylistTab musicPlayerRef={musicPlayerRef} />
        </TabsContent>
        {currentSong?.video_url && (
          <TabsContent value="video" className="mt-4">
            <TabVideo src={currentSong?.video_url ?? ""} />
          </TabsContent>
        )}
      </Tabs>

      {/* Picture-in-picture video player - only shown on medium and large screens */}
      <PictureInPictureVideo
        src={currentSong?.video_url ?? ""}
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
      />
      <MusicPlayer
        className="sticky bottom-0 bg-background pb-4"
        ref={musicPlayerRef}
      />
    </div>
  );
}
