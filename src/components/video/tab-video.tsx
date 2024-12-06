import { store } from "@/stores";
import {
  currentTimeAtom,
  playbackRateAtom,
  playerStateAtom,
  volumeAtom,
} from "@/stores/slices/music_player_store";
import { createScopedLogger } from "@/utils";
import {
  MediaLoadedMetadataEvent,
  MediaPlayerInstance,
  MediaTimeUpdateEvent,
  MediaTimeUpdateEventDetail,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import VideoPlayer from "./video-player";

const logger = createScopedLogger("TabVideo");

export default function TabVideo({ src }: { src: string }) {
  const [videoWidth, setVideoWidth] = useState(160);
  const [videoHeight, setVideoHeight] = useState(90);

  const aspectRatio = useMemo(() => {
    return `${videoWidth}/${videoHeight}`;
  }, [videoWidth, videoHeight]);

  const videoRef = useRef<MediaPlayerInstance>(null);
  const remote = useMediaRemote(videoRef);
  const syncLockRef = useRef(false);

  const musicCurrentTime = useAtomValue(currentTimeAtom);
  const musicPlayerState = useAtomValue(playerStateAtom);
  const musicVolume = useAtomValue(volumeAtom);
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

  // Set volume to 0
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

  const handleVideoLoad = useCallback(
    (nativeEvent: MediaLoadedMetadataEvent) => {
      // const target = nativeEvent.trigger?.target;
      // if (target && isHTMLVideoElement(target)) {
      //   logger.info("video loaded", target.videoWidth, target.videoHeight);
      //   setVideoWidth(target.videoWidth);
      //   setVideoHeight(target.videoHeight);
      // }
    },
    []
  );

  return (
    <div>
      <VideoPlayer
        ref={videoRef}
        src={src}
        aspectRatio={aspectRatio}
        onLoadedMetadata={handleVideoLoad}
        currentTime={musicCurrentTime}
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
}
