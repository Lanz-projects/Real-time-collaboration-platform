import { VideoFeed } from "./video-feed";
import { Button } from "./ui/button";
import { Maximize2 } from "lucide-react";
import type { VideoLayoutMode, WorkspaceLayoutMode } from "./view-options-menu";

interface Participant {
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  uid: string | number;
  isScreenSharing?: boolean;
}

interface VideoGridProps {
  participants: Participant[];
  videoLayout: VideoLayoutMode;
  workspaceLayout: WorkspaceLayoutMode;
  currentSpeaker?: string;
  onToggleFullscreen?: () => void;
  onTileClick?: (uid: string | number) => void;
  className?: string;
}

export function VideoGrid({
  participants,
  videoLayout,
  workspaceLayout,
  currentSpeaker = "John Doe",
  onToggleFullscreen,
  onTileClick,
  className = "",
}: VideoGridProps) {
  // Filter participants based on video layout
  const getFilteredParticipants = () => {
    switch (videoLayout) {
      case "myVideoOnly":
        return participants.filter((p) => p.isLocal);
      case "hideMyVideo":
        return participants.filter((p) => !p.isLocal);
      default:
        return participants;
    }
  };

  const filteredParticipants = getFilteredParticipants();
  const speakerParticipant =
    participants.find((p) => p.name === currentSpeaker) || participants[0];

  // Exclude the main speaker from the sidebar
  const otherParticipants = filteredParticipants.filter(
    (p) => p.uid !== speakerParticipant.uid
  );

  // Determine grid layout based on workspace layout and video layout
  const getGridLayout = () => {
    if (workspaceLayout === "fullVideo") {
      // Full video view - use optimal grid
      const count = filteredParticipants.length;
      if (count <= 2) return "grid-cols-1 lg:grid-cols-2";
      if (count <= 4) return "grid-cols-2";
      if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
      return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    }

    if (workspaceLayout === "focusWorkspace") {
      // Minimal video thumbnails
      return "grid-cols-2 max-w-64";
    }

    // Default split view
    const count = filteredParticipants.length;
    if (count <= 4) return "grid-cols-2 lg:grid-cols-4";
    return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  const renderGalleryView = () => (
    <div className={`grid gap-3 ${getGridLayout()}`}>
      {filteredParticipants.map((participant, index) => (
        <VideoFeed
          key={`${participant.uid}-${index}`}
          userName={participant.name}
          isLocalUser={participant.isLocal}
          isMuted={participant.isMuted}
          isCameraOff={participant.isCameraOff}
          uid={participant.uid}
          isScreenSharing={participant.isScreenSharing}
          onClick={() => onTileClick?.(participant.uid)}
        />
      ))}
    </div>
  );

  const renderSpeakerView = () => {
    const isAlone = filteredParticipants.length === 1;

    return (
      <div className={`flex gap-4 h-full ${isAlone ? "justify-center" : ""}`}>
        {/* Main speaker video */}
        <div className={`flex-1 ${isAlone ? "max-w-full" : ""}`}>
          <VideoFeed
            userName={speakerParticipant.name}
            isLocalUser={speakerParticipant.isLocal}
            isMuted={speakerParticipant.isMuted}
            isCameraOff={speakerParticipant.isCameraOff}
            uid={speakerParticipant.uid}
            isScreenSharing={speakerParticipant.isScreenSharing}
            onClick={() => onTileClick?.(speakerParticipant.uid)}
          />
        </div>

        {/* Sidebar only if there are other participants */}
        {!isAlone && otherParticipants.length > 0 && (
          <div className="w-48 space-y-3">
            {otherParticipants.slice(0, 4).map((participant, index) => (
              <div key={`${participant.uid}-${index}`} className="aspect-video">
                <VideoFeed
                  userName={participant.name}
                  isLocalUser={participant.isLocal}
                  isMuted={participant.isMuted}
                  isCameraOff={participant.isCameraOff}
                  uid={participant.uid}
                  isScreenSharing={participant.isScreenSharing}
                  onClick={() => onTileClick?.(participant.uid)}
                />
              </div>
            ))}
            {otherParticipants.length > 4 && (
              <div className="text-xs text-muted-foreground text-center">
                +{otherParticipants.length - 4} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderThumbnailView = () => (
    <div className="flex gap-2">
      {filteredParticipants.slice(0, 3).map((participant, index) => (
        <div key={`${participant.uid}-${index}`} className="w-24 aspect-video">
          <VideoFeed
            userName={participant.name}
            isLocalUser={participant.isLocal}
            isMuted={participant.isMuted}
            isCameraOff={participant.isCameraOff}
            uid={participant.uid}
            isScreenSharing={participant.isScreenSharing}
            onClick={() => onTileClick?.(participant.uid)}
          />
        </div>
      ))}
      {filteredParticipants.length > 3 && (
        <div className="w-24 aspect-video bg-muted rounded-lg flex items-center justify-center">
          <span className="text-xs text-muted-foreground">
            +{filteredParticipants.length - 3}
          </span>
        </div>
      )}
    </div>
  );

  const getVideoContent = () => {
    if (workspaceLayout === "focusWorkspace") {
      return renderThumbnailView();
    }

    if (videoLayout === "speaker") {
      return renderSpeakerView();
    }

    return renderGalleryView();
  };

  return (
    <div className={`relative ${className}`}>
      {workspaceLayout === "focusWorkspace" && onToggleFullscreen && (
        <div className="absolute top-2 right-2 z-10">
          <Button size="sm" variant="outline" onClick={onToggleFullscreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      {getVideoContent()}
    </div>
  );
}