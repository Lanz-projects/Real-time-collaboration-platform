import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import type { UserMetadata } from "./agoraRTMHelper";

export interface RemoteUser {
  uid: string | number;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
  hasVideo: boolean;
  hasAudio: boolean;
  isScreenSharing?: boolean;
}

export interface AgoraConfig {
  appId: string;
  roomId: string;
  uid: string;
}

export interface AgoraConfigWithName extends AgoraConfig {
  displayName: string;
}

export interface LocalTracks {
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
  screenTrack: any | null;
}

export interface ScreenSharingState {
  isActive: boolean;
  sharerUid: string | number | null;
  sharerName?: string;
}

export interface AgoraState {
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  remoteUsers: Map<string | number, RemoteUser>;
  isConnected: boolean;
  localTracks: LocalTracks;
  screenSharingState: ScreenSharingState;
  userMetadata: Map<string | number, UserMetadata>;
}

export interface AgoraActions {
  joinChannel: () => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  getUserDisplayName: (userId: string | number) => string;
}

export type { IAgoraRTCClient, UserMetadata };