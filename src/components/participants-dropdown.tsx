import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, User } from "lucide-react";

interface Participant {
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  uid: string | number;
  isScreenSharing: boolean;
}

interface ParticipantsDropdownProps {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function ParticipantsDropdown({
  participants,
  isOpen,
  onClose,
  anchorRef,
}: ParticipantsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">
          Participants ({participants.length})
        </h2>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {participants.map((participant) => (
          <div
            key={participant.uid}
            className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {participant.name}
                    </span>
                    {participant.isLocal && (
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                        You
                      </span>
                    )}
                  </div>
                  {participant.isScreenSharing && (
                    <div className="flex items-center gap-1 mt-1">
                      <Monitor className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">
                        Sharing screen
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {participant.isMuted ? (
                  <div className="p-1.5 rounded-full bg-red-100" title="Muted" aria-label={`${participant.name} is muted`}>
                    <MicOff className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-full bg-green-100" title="Unmuted" aria-label={`${participant.name} is unmuted`}>
                    <Mic className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                  </div>
                )}
                {participant.isCameraOff ? (
                  <div className="p-1.5 rounded-full bg-red-100" title="Camera off" aria-label={`${participant.name} camera is off`}>
                    <VideoOff className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-full bg-green-100" title="Camera on" aria-label={`${participant.name} camera is on`}>
                    <Video className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}