import {
  MediaLoadedMetadataEvent,
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
  MediaTimeUpdateEvent,
  MediaTimeUpdateEventDetail,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import { forwardRef } from "react";

import "@vidstack/react/player/styles/default/layouts/video.css";
import "@vidstack/react/player/styles/default/theme.css";

interface VideoPlayerProps {
  src: string;
  onLoadedMetadata: (nativeEvent: MediaLoadedMetadataEvent) => void;
  aspectRatio: string;
  currentTime?: number;
  onTimeUpdate?: (
    detail: MediaTimeUpdateEventDetail,
    nativeEvent: MediaTimeUpdateEvent
  ) => void;
}

const VideoPlayer = forwardRef<MediaPlayerInstance, VideoPlayerProps>(
  ({ src, onLoadedMetadata, aspectRatio, currentTime, onTimeUpdate }, ref) => {
    return (
      <MediaPlayer
        ref={ref}
        src={src}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        aspectRatio={aspectRatio}
        currentTime={currentTime}
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
