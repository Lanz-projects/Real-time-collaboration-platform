import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { VideoGrid } from "./video-grid";
import {
  ViewOptionsMenu,
  type VideoLayoutMode,
  type WorkspaceLayoutMode,
} from "./view-options-menu";
import { SharedNotesPanel } from "./shared-notes-panel";
import { CollaborativeWhiteboard } from "./collab-whiteboard";
import { ParticipantsDropdown } from "./participants-dropdown";
import { LiveblocksProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { RoomProvider } from "../liveblocks.config";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  FileText,
  Users,
  PenTool,
  Minimize2,
} from "lucide-react";
import { useAgoraRTC } from "./agora/useAgora";
import { getUid } from "./agora/agoraHelpers";
import { logger } from "../utils/logger";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
const LIVEBLOCKS_PUBLIC_KEY = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY;

interface MainRoomProps {
  roomId: string;
  roomCode: string;
  displayName: string;
  isCreator?: boolean;
  onLeaveRoom: () => void;
}

function MainRoomContent({
  roomId,
  roomCode,
  displayName,
  isCreator = false,
  onLeaveRoom,
}: MainRoomProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [videoLayout, setVideoLayout] = useState<VideoLayoutMode>("gallery");
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayoutMode>("split");
  const [expandedUserId, setExpandedUserId] = useState<string | number | null>(null);
  const [notesPanelWidth, setNotesPanelWidth] = useState(400);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const participantsBadgeRef = useRef<HTMLDivElement>(null);

  const uid = getUid();

  const {
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    remoteUsers,
    localVideoTrack,
    localScreenTrack,
    leaveChannel,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    getUserDisplayName,
    noteContent,
    noteLock,
    acquireNoteLock,
    releaseNoteLock,
    sendNoteUpdate,
  } = useAgoraRTC({
    appId: APP_ID,
    roomId,
    uid,
    displayName,
  });

  // Re-render video tracks when layout or video state changes to ensure proper display
  useEffect(() => {
    const timer = setTimeout(() => {
      const localTrack = isScreenSharing ? localScreenTrack : localVideoTrack;
      if (localTrack) {
        const localPlayerContainer = document.getElementById(`user-${uid}`);
        if (localPlayerContainer) {
          localTrack.play(localPlayerContainer);
        }
      }

      if (expandedUserId === uid && localTrack) {
        const workspaceContainer = document.getElementById("workspace-video-container");
        if (workspaceContainer) {
          workspaceContainer.innerHTML = '';
          localTrack.play(workspaceContainer, { fit: "contain" });

          setTimeout(() => {
            const videoElement = workspaceContainer.querySelector('video');
            if (videoElement) {
              videoElement.style.objectFit = 'contain';
              videoElement.style.width = '100%';
              videoElement.style.height = '100%';
            }
          }, 50);
          logger.log("Playing local track in workspace");
        }
      }

      remoteUsers.forEach((user) => {
        if (user.videoTrack && user.hasVideo) {
          const playerContainer = document.getElementById(`user-${user.uid}`);
          if (playerContainer) {
            user.videoTrack.play(playerContainer);
          }

          if (expandedUserId === user.uid) {
            const workspaceContainer = document.getElementById("workspace-video-container");
            if (workspaceContainer) {
              workspaceContainer.innerHTML = '';
              user.videoTrack.play(workspaceContainer, { fit: "contain" });

              setTimeout(() => {
                const videoElement = workspaceContainer.querySelector('video');
                if (videoElement) {
                  videoElement.style.objectFit = 'contain';
                  videoElement.style.width = '100%';
                  videoElement.style.height = '100%';
                }
              }, 50);
              logger.log(`Playing user ${user.uid}'s track in workspace`);
            }
          }
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [
    videoLayout,
    workspaceLayout,
    uid,
    isCameraOff,
    isScreenSharing,
    remoteUsers,
    localVideoTrack,
    localScreenTrack,
    expandedUserId,
  ]);

  const handleLeaveRoom = async () => {
    await leaveChannel();
    onLeaveRoom();
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      if (expandedUserId === uid) {
        setExpandedUserId(null);
        setWorkspaceLayout("split");
      }
    } else {
      const success = await startScreenShare();

      if (success) {
        setShowWhiteboard(false);
        setExpandedUserId(uid);
        setWorkspaceLayout("focusWorkspace");
      }
    }
  };

  const handleVideoTileClick = (userId: string | number) => {
    setExpandedUserId(userId);
    setWorkspaceLayout("focusWorkspace");
    setShowWhiteboard(false);
  };

  const participants = [
    {
      name: displayName,
      isLocal: true,
      isMuted: isMicMuted,
      isCameraOff,
      uid: uid,
      isScreenSharing,
    },
    ...Array.from(remoteUsers.values()).map((user) => ({
      name: getUserDisplayName(user.uid),
      isLocal: false,
      isMuted: !user.hasAudio,
      isCameraOff: !user.hasVideo,
      uid: user.uid,
      isScreenSharing: user.isScreenSharing || false,
    })),
  ];

  const handleWorkspaceLayoutChange = (layout: WorkspaceLayoutMode) => {
    setWorkspaceLayout(layout);

    if (layout !== "focusWorkspace") {
      setExpandedUserId(null);
    }

    if (layout === "focusScreenShare" && !isScreenSharing) {
      handleToggleScreenShare();
      setShowWhiteboard(false);
    }
  };

  const roomName = roomId.split("#")[0];

  const getWorkspaceContent = () => {
    if (expandedUserId !== null) {
      const isLocalUser = expandedUserId === uid;
      const remoteUser = remoteUsers.get(expandedUserId);
      const userIsScreenSharing = isLocalUser ? isScreenSharing : remoteUser?.isScreenSharing;
      const displayNameForUser = isLocalUser ? displayName : getUserDisplayName(expandedUserId);

      return (
        <div className="w-full flex-1 bg-gray-900 rounded-lg overflow-hidden relative flex flex-col">
          <div
            id="workspace-video-container"
            className="w-full flex-1 flex items-center justify-center bg-gray-900"
          />
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            {userIsScreenSharing && <Monitor className="w-4 h-4" />}
            <span className="font-medium">{displayNameForUser}</span>
            {userIsScreenSharing && <span className="text-sm text-gray-300">• Sharing screen</span>}
          </div>
          <button
            onClick={() => {
              setExpandedUserId(null);
              setWorkspaceLayout("split");
            }}
            className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-lg hover:bg-black/90 transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (showWhiteboard) {
      return (
        <div className="flex-1 bg-white rounded-lg overflow-hidden relative">
          <ClientSideSuspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading whiteboard...</p>
              </div>
            </div>
          }>
            <CollaborativeWhiteboard
              isVisible={showWhiteboard}
              onClose={() => setShowWhiteboard(false)}
              participants={participants}
              onExpand={() => setWorkspaceLayout("focusWorkspace")}
              onMinimize={() => setWorkspaceLayout("split")}
              isExpanded={workspaceLayout === "focusWorkspace"}
            />
          </ClientSideSuspense>
        </div>
      );
    }

    return (
      <div className="flex-1 min-h-0 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <p className="text-xl mb-2">Workspace</p>
          <p className="text-sm text-gray-500">
            Display the Whiteboard here.
          </p>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (workspaceLayout) {
      case "focusWorkspace":
        return (
          <div className="h-full flex flex-col p-6">
            {getWorkspaceContent()}
          </div>
        );

      case "focusScreenShare":
        return (
          <div className="h-full flex items-center justify-center p-6">
            <div className="max-w-4xl w-full h-full flex flex-col">
              {isScreenSharing ? (
                getWorkspaceContent()
              ) : (
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <Monitor className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-xl mb-2">Screen Share Mode</p>
                  <p className="text-sm text-gray-300">
                    Click on a screen sharing tile to view it here
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-white flex-shrink-0">
              <VideoGrid
                participants={participants}
                videoLayout={videoLayout}
                workspaceLayout={workspaceLayout}
                onTileClick={handleVideoTileClick}
                className="bg-gray-50 rounded-lg p-4"
              />
            </div>
            <div className="flex-1 min-h-0 p-6 flex flex-col">{getWorkspaceContent()}</div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Room: {roomName}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Code: {roomCode} {isCreator && "• Created by you"}
            </p>
          </div>
          <div className="relative">
            <div
              ref={participantsBadgeRef}
              onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
              className="cursor-pointer"
            >
              <Badge
                variant="outline"
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Users className="w-4 h-4" />
                {participants.length} participants
              </Badge>
            </div>
            <ParticipantsDropdown
              participants={participants}
              isOpen={isParticipantsOpen}
              onClose={() => setIsParticipantsOpen(false)}
              anchorRef={participantsBadgeRef as React.RefObject<HTMLElement>}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ViewOptionsMenu
            videoLayout={videoLayout}
            workspaceLayout={workspaceLayout}
            onVideoLayoutChange={setVideoLayout}
            onWorkspaceLayoutChange={handleWorkspaceLayoutChange}
            isScreenSharing={isScreenSharing}
          />
          <Button
            variant="destructive"
            onClick={handleLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Leave Room
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col relative">
        {renderMainContent()}
        {showNotes && (
          <div
            className="absolute right-0 top-0 bottom-0 flex shadow-2xl z-50"
            style={{ width: `${notesPanelWidth}px` }}
          >
            {/* Resizable drag handle */}
            <div
              className="w-2 bg-gray-200 hover:bg-blue-500 transition-colors cursor-col-resize relative group flex items-center justify-center flex-shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = notesPanelWidth;

                const handleMouseMove = (e: MouseEvent) => {
                  const diff = startX - e.clientX;
                  const newWidth = Math.min(Math.max(startWidth + diff, 280), 800);
                  setNotesPanelWidth(newWidth);
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col gap-1">
                  <div className="w-1 h-8 bg-gray-400 group-hover:bg-white rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex-1 h-full overflow-hidden">
              <SharedNotesPanel
                isVisible={showNotes}
                onClose={() => setShowNotes(false)}
                currentUser={displayName}
                currentUserId={uid.toString()}
                participants={participants}
                noteContent={noteContent}
                lockedBy={noteLock.userId}
                lockedByName={noteLock.displayName}
                onAcquireLock={acquireNoteLock}
                onReleaseLock={releaseNoteLock}
                onSendNoteUpdate={sendNoteUpdate}
              />
            </div>
          </div>
        )}
      </div>

      {workspaceLayout !== "focusWorkspace" &&
        workspaceLayout !== "focusScreenShare" && (
          <div className="p-6 border-t border-gray-200 bg-white shadow-lg flex-shrink-0">
            <div className="flex items-center justify-center gap-6">
              <Button
                variant={isMicMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleMicrophone}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isMicMuted
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                {isMicMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                {isMicMuted ? "Unmute" : "Mute"} Mic
              </Button>

              <Button
                variant={isCameraOff ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleCamera}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isCameraOff
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                {isCameraOff ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
                {isCameraOff ? "Turn On" : "Turn Off"} Camera
              </Button>

              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                onClick={handleToggleScreenShare}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isScreenSharing
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <Monitor className="w-5 h-5" />
                {isScreenSharing ? "Stop" : "Share"} Screen
              </Button>

              <Button
                variant={showWhiteboard ? "default" : "secondary"}
                size="lg"
                onClick={() => {
                  setShowWhiteboard(!showWhiteboard);
                  if (!showWhiteboard) {
                    setExpandedUserId(null);
                    stopScreenShare();
                  }
                }}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
                  showWhiteboard
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <PenTool className="w-5 h-5" />
                {showWhiteboard ? "Close" : "Whiteboard"}
              </Button>

              <Button
                variant={showNotes ? "default" : "secondary"}
                size="lg"
                onClick={() => setShowNotes(!showNotes)}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
                  showNotes
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <FileText className="w-5 h-5" />
                Notes
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}

export function MainRoom(props: MainRoomProps) {
  // Check for required environment variables
  if (!APP_ID) {
    logger.error("VITE_AGORA_APP_ID is not set in environment variables");
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Configuration Error</p>
          <p className="text-gray-600">Agora App ID is not configured.</p>
          <p className="text-sm text-gray-500 mt-2">Please add VITE_AGORA_APP_ID to your .env file</p>
        </div>
      </div>
    );
  }

  if (!LIVEBLOCKS_PUBLIC_KEY) {
    logger.error("VITE_LIVEBLOCKS_PUBLIC_KEY is not set in environment variables");
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Configuration Error</p>
          <p className="text-gray-600">Liveblocks API key is not configured.</p>
          <p className="text-sm text-gray-500 mt-2">Please add VITE_LIVEBLOCKS_PUBLIC_KEY to your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={LIVEBLOCKS_PUBLIC_KEY}>
      <RoomProvider 
        id={props.roomId}
        initialPresence={{
          cursor: null,
          userName: props.displayName,
          userColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        }}
      >
        <MainRoomContent {...props} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}