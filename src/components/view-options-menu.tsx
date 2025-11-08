import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Grid3X3,
  Maximize2,
  User,
  Users,
  EyeOff,
  Monitor,
  Layout,
  Video,
} from "lucide-react"; //Eye , PenTool

export type VideoLayoutMode =
  | "gallery"
  | "speaker"
  | "myVideoOnly"
  | "hideMyVideo";
export type WorkspaceLayoutMode =
  | "split"
  | "focusWorkspace"
  | "focusScreenShare"
  | "fullVideo";

interface ViewOptionsMenuProps {
  videoLayout: VideoLayoutMode;
  workspaceLayout: WorkspaceLayoutMode;
  onVideoLayoutChange: (layout: VideoLayoutMode) => void;
  onWorkspaceLayoutChange: (layout: WorkspaceLayoutMode) => void;
  isScreenSharing: boolean;
}

export function ViewOptionsMenu({
  videoLayout,
  workspaceLayout,
  onVideoLayoutChange,
  onWorkspaceLayoutChange,
  isScreenSharing,
}: ViewOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const videoLayoutOptions = [
    {
      id: "gallery" as VideoLayoutMode,
      label: "Gallery View",
      description: "All participants in a grid",
      icon: Grid3X3,
      isDefault: true,
    },
    {
      id: "speaker" as VideoLayoutMode,
      label: "Speaker View",
      description: "Focus on current speaker",
      icon: User,
      isDefault: false,
    },
    {
      id: "myVideoOnly" as VideoLayoutMode,
      label: "My Video Only",
      description: "Show only your camera",
      icon: Video,
      isDefault: false,
    },
    {
      id: "hideMyVideo" as VideoLayoutMode,
      label: "Hide My Video",
      description: "Hide your own camera",
      icon: EyeOff,
      isDefault: false,
    },
  ];

  const workspaceLayoutOptions = [
    {
      id: "split" as WorkspaceLayoutMode,
      label: "Show Video & Workspace",
      description: "Balanced split view",
      icon: Layout,
      isDefault: true,
    },
    {
      id: "focusWorkspace" as WorkspaceLayoutMode,
      label: "Focus on Workspace",
      description: "Maximize workspace area",
      icon: Maximize2,
      isDefault: false,
    },
    {
      id: "focusScreenShare" as WorkspaceLayoutMode,
      label: "Focus on Screen Share",
      description: "Full screen shared content",
      icon: Monitor,
      isDefault: false,
      disabled: !isScreenSharing,
    },
    {
      id: "fullVideo" as WorkspaceLayoutMode,
      label: "Full Video View",
      description: "Videos fill entire screen",
      icon: Users,
      isDefault: false,
    },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4" />
          View Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md z-[1000]"
        align="end"
      >
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Video Layout</p>
        </div>
        {videoLayoutOptions.map((option) => {
          const Icon = option.icon;
          const isActive = videoLayout === option.id;

          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onVideoLayoutChange(option.id)}
              className={`flex items-center gap-3 px-2 py-2 cursor-pointer ${
                isActive ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{option.label}</span>
                  {option.isDefault && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  {isActive && (
                    <div className="w-2 h-2 bg-primary rounded-full ml-auto"></div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Workspace Layout</p>
        </div>
        {workspaceLayoutOptions.map((option) => {
          const Icon = option.icon;
          const isActive = workspaceLayout === option.id;
          const isDisabled = option.disabled;

          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => !isDisabled && onWorkspaceLayoutChange(option.id)}
              className={`flex items-center gap-3 px-2 py-2 cursor-pointer ${
                isActive ? "bg-accent text-accent-foreground" : ""
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isDisabled}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive
                    ? "text-primary"
                    : isDisabled
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground"
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{option.label}</span>
                  {option.isDefault && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  {isActive && !isDisabled && (
                    <div className="w-2 h-2 bg-primary rounded-full ml-auto"></div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
