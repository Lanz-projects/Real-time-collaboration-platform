import { Avatar, AvatarFallback } from "./ui/avatar";
import { MicOff, Monitor } from "lucide-react";
import { cn } from "../lib/utils";

interface VideoFeedProps {
  userName: string;
  isLocalUser?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  uid?: string | number;
  isScreenSharing?: boolean;
  onClick?: () => void;
}

export function VideoFeed({
  userName,
  isLocalUser = false,
  isMuted = false,
  isCameraOff = false,
  uid,
  isScreenSharing = false,
  onClick,
}: VideoFeedProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative bg-gray-900 rounded-lg overflow-hidden aspect-video",
        onClick && "cursor-pointer hover:ring-4 hover:ring-blue-500 transition-all",
        isScreenSharing && "ring-2 ring-green-500"
      )}
      onClick={onClick}
    >
      {/* Video container - always rendered so Agora can play into it */}
      <div
        id={`user-${uid}`}
        className="w-full h-full bg-black"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Avatar overlay - shown on top when camera is off */}
      {isCameraOff && !isScreenSharing && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-800 z-10">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-lg bg-blue-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Screen sharing indicator badge */}
      {isScreenSharing && (
        <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1.5 text-xs font-medium z-20">
          <Monitor className="w-3.5 h-3.5" />
          Presenting
        </div>
      )}

      {/* User name label */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium z-20">
        {userName} {isLocalUser && "(You)"}
      </div>

      {/* Muted indicator */}
      {isMuted && (
        <div className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full z-20">
          <MicOff className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Click hint overlay for screen sharing tiles */}
      {isScreenSharing && onClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-30">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Click to expand
          </div>
        </div>
      )}
    </div>
  );
}