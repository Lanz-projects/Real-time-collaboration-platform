import { useEffect, useMemo, useState } from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useRoom, useOthers } from "../liveblocks.config";
import { useSyncDemo } from "@tldraw/sync";
import { PenTool, Users, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface CollaborativeWhiteboardProps {
  isVisible: boolean;
  onClose: () => void;
  participants: Array<{ name: string; isLocal: boolean; uid: string | number }>;
  onExpand?: () => void;
  onMinimize?: () => void;
  isExpanded?: boolean;
}

// Helper to generate consistent colors for users
function stringToColor(str: string): string {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA15E", "#BC6C25", "#C77DFF", "#FF9FF3", "#54A0FF",
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function CollaborativeWhiteboard({
  isVisible,
  onClose: _onClose,
  participants,
  onExpand,
  onMinimize,
  isExpanded = false,
}: CollaborativeWhiteboardProps) {
  const room = useRoom();
  const others = useOthers();
  const [isLoading, setIsLoading] = useState(true);

  // Create a unique room ID for this tldraw session
  const roomId = useMemo(() => room.id, [room.id]);

  /**
   * Collaborative whiteboard synchronization
   *
   * Uses tldraw's useSyncDemo hook which provides real-time collaboration.
   * This syncs all drawing operations (shapes, strokes, text) across participants
   * using Liveblocks as the backend for state synchronization.
   *
   * All participants connected to the same roomId will see the same canvas
   * and changes are broadcast in real-time with conflict resolution.
   */
  const store = useSyncDemo({
    roomId: roomId,
  });

  // Handle loading state
  useEffect(() => {
    if (store) {
      setIsLoading(false);
    }
  }, [store]);

  // Active collaborators (excluding current user)
  const activeCollaborators = useMemo(() => {
    return participants.filter(p => !p.isLocal);
  }, [participants]);

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col">
      <div className="w-full h-full flex flex-col border-l border-border bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex flex-row items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Collaborative Whiteboard</h2>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && onMinimize && (
              <button
                onClick={onMinimize}
                className="bg-black/70 text-white p-2 rounded-lg hover:bg-black/90 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Minimize"
                aria-label="Minimize whiteboard to panel view"
              >
                <Minimize2 className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
            {!isExpanded && onExpand && (
              <button
                onClick={onExpand}
                className="bg-black/70 text-white p-2 rounded-lg hover:bg-black/90 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Expand to focus view"
                aria-label="Expand whiteboard to full screen"
              >
                <Maximize2 className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Info Bar */}
        <div className="px-4 pt-3 pb-2 space-y-2">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Draw and collaborate in real-time with all participants
            </p>
          </div>

          {/* Active Collaborators */}
          {activeCollaborators.length > 0 && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600">
                  {activeCollaborators.length} other{activeCollaborators.length !== 1 ? "s" : ""} online:
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {activeCollaborators.map((collab) => (
                  <div key={collab.uid} className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-xs" style={{ backgroundColor: stringToColor(collab.name) }}>
                        {collab.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-blue-600">{collab.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Whiteboard Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full">
              <Tldraw
                store={store}
                autoFocus
                components={{
                  SharePanel: null,
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-border">
          <Badge variant="outline" className="text-xs">
            {isLoading ? "Connecting..." : "Real-time sync"}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`}></div>
            <span>{isLoading ? "Connecting" : `${others.length + 1} online`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}