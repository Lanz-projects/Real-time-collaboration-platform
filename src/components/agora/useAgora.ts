import { useState, useRef, useEffect, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import type { RemoteUser, AgoraConfigWithName, ScreenSharingState } from "./agoraTypes";
import { playVideoTrack, closeTrack } from "./agoraHelpers";
import { AgoraRTMManager, type UserMetadata } from "./agoraRTMHelper";
import { logger } from "../../utils/logger";

export function useAgoraRTC(config: AgoraConfigWithName) {
  const { appId, roomId, uid, displayName } = config;

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<Map<string | number, RemoteUser>>(
    new Map()
  );
  const [userMetadata, setUserMetadata] = useState<Map<string | number, UserMetadata>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [screenSharingState, setScreenSharingState] = useState<ScreenSharingState>({
    isActive: false,
    sharerUid: null,
  });
  const [noteContent, setNoteContent] = useState('');
  const [noteLock, setNoteLock] = useState<{
    userId: string | null;
    displayName: string | null;
  }>({ userId: null, displayName: null });

  const clientRef = useRef<any>(null);
  const rtmManagerRef = useRef<AgoraRTMManager | null>(null);
  const localVideoTrackRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localScreenTrackRef = useRef<any>(null);
  const previousVideoStateRef = useRef<Map<string | number, boolean>>(new Map());
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const handleUserPublished = useCallback(
    async (user: any, mediaType: "audio" | "video") => {
      try {
        await clientRef.current?.subscribe(user, mediaType);
        logger.log("Subscribed to user:", user.uid, mediaType);

        setRemoteUsers((prev) => {
          const newMap = new Map(prev);
          const existingUser: RemoteUser = newMap.get(user.uid) || {
            uid: user.uid,
            hasVideo: false,
            hasAudio: false,
            videoTrack: undefined,
            audioTrack: undefined,
            isScreenSharing: false,
          };

          if (mediaType === "video") {
            const hadVideoBefore = previousVideoStateRef.current.get(user.uid) || false;
            const wasScreenSharing = existingUser.isScreenSharing || false;
            const hadVideoButUnpublished = hadVideoBefore && !existingUser.hasVideo;

            existingUser.videoTrack = user.videoTrack;
            existingUser.hasVideo = true;

            // Screen sharing is detected by the pattern: camera unpublish followed by new video publish
            if (hadVideoBefore && !wasScreenSharing && hadVideoButUnpublished) {
              existingUser.isScreenSharing = true;
              logger.log(`✓✓✓ User ${user.uid} STARTED SCREEN SHARING`);

              setScreenSharingState({
                isActive: true,
                sharerUid: user.uid,
              });
            } else {
              existingUser.isScreenSharing = false;
              logger.log(`✓ User ${user.uid} published CAMERA VIDEO`);
            }

            playVideoTrack(user.videoTrack, `user-${user.uid}`);
            previousVideoStateRef.current.set(user.uid, true);
          }

          if (mediaType === "audio") {
            existingUser.audioTrack = user.audioTrack;
            existingUser.hasAudio = true;
            user.audioTrack?.play();
          }

          newMap.set(user.uid, existingUser);
          return newMap;
        });
      } catch (error) {
        logger.error("Error subscribing to user:", error);
      }
    },
    []
  );

  const handleUserUnpublished = useCallback(
    (user: any, mediaType: "audio" | "video") => {
      logger.log("User unpublished:", user.uid, mediaType);

      setRemoteUsers((prev) => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(user.uid);

        if (existingUser) {
          if (mediaType === "video") {
            const wasScreenSharing = existingUser.isScreenSharing;
            
            existingUser.videoTrack = undefined;
            existingUser.hasVideo = false;
            
            if (wasScreenSharing) {
              existingUser.isScreenSharing = false;
              previousVideoStateRef.current.delete(user.uid);
              logger.log(`User ${user.uid} stopped screen sharing`);
              
              setScreenSharingState({
                isActive: false,
                sharerUid: null,
              });
            } else {
              logger.log(`User ${user.uid} unpublished camera`);
            }
          }
          if (mediaType === "audio") {
            existingUser.audioTrack = undefined;
            existingUser.hasAudio = false;
          }
          newMap.set(user.uid, existingUser);
        }

        return newMap;
      });
    },
    []
  );

  const handleUserJoined = useCallback((user: any) => {
    logger.log("User joined:", user.uid);
    setRemoteUsers((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(user.uid)) {
        newMap.set(user.uid, {
          uid: user.uid,
          hasVideo: false,
          hasAudio: false,
          videoTrack: undefined,
          audioTrack: undefined,
          isScreenSharing: false,
        });
      }
      return newMap;
    });
  }, []);

  const handleUserLeft = useCallback((user: any) => {
    logger.log("User left:", user.uid);
    setRemoteUsers((prev) => {
      const newMap = new Map(prev);
      const existingUser = newMap.get(user.uid);
      
      if (existingUser?.isScreenSharing) {
        setScreenSharingState({
          isActive: false,
          sharerUid: null,
        });
      }
      
      newMap.delete(user.uid);
      previousVideoStateRef.current.delete(user.uid);
      return newMap;
    });
  }, []);

  // Initialize and publish local audio/video tracks with graceful error handling for missing devices
  const joinStream = useCallback(async () => {
    try {
      if (!clientRef.current) return;

      const tracksToPublish: any[] = [];

      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;
        tracksToPublish.push(audioTrack);
        logger.log("✓ Created microphone track");
      } catch (error) {
        logger.warn("Could not create microphone track:", error);
      }

      try {
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: { min: 640, ideal: 1920, max: 1920 },
            height: { min: 480, ideal: 1080, max: 1080 },
          },
        });
        localVideoTrackRef.current = videoTrack;
        tracksToPublish.push(videoTrack);
        playVideoTrack(videoTrack, `user-${uid}`, 0);
        logger.log("✓ Created camera track");
      } catch (error) {
        logger.warn("Could not create camera track:", error);
        setIsCameraOff(true);
      }

      if (tracksToPublish.length > 0) {
        await clientRef.current.publish(tracksToPublish);
        logger.log(`Published ${tracksToPublish.length} local track(s)`);
      } else {
        logger.warn("No tracks available to publish");
      }
    } catch (error) {
      logger.error("Error joining stream:", error);
    }
  }, [uid]);

  // Initialize Agora RTC and RTM on mount, cleanup on unmount
  useEffect(() => {
    // Prevent duplicate initialization in React Strict Mode
    if (isInitializingRef.current || hasInitializedRef.current) {
      logger.log('Skipping duplicate initialization');
      return;
    }

    isInitializingRef.current = true;

    const initAgora = async () => {
      try {
        logger.log('🚀 Starting Agora initialization...');

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-joined", handleUserJoined);
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-left", handleUserLeft);

        logger.log('Joining RTC channel...');
        await client.join(appId, roomId, null, uid);
        setIsConnected(true);
        hasInitializedRef.current = true;

        logger.log("✅ Successfully joined RTC channel:", roomId);

        // Add any users already in the channel to our local state
        const existingUsers = client.remoteUsers;
        if (existingUsers && existingUsers.length > 0) {
          logger.log("Found existing users in channel:", existingUsers.map((u: any) => u.uid));
          setRemoteUsers((prev) => {
            const newMap = new Map(prev);
            existingUsers.forEach((user: any) => {
              if (!newMap.has(user.uid)) {
                newMap.set(user.uid, {
                  uid: user.uid,
                  hasVideo: false,
                  hasAudio: false,
                  videoTrack: undefined,
                  audioTrack: undefined,
                  isScreenSharing: false,
                });
              }
            });
            return newMap;
          });
        }

        await joinStream();

        logger.log('Initializing RTM...');
        const rtmManager = new AgoraRTMManager({
          appId,
          userId: uid.toString(),
          channelName: roomId,
          displayName,
        });

        const rtmSuccess = await rtmManager.initialize(
          (metadata) => {
            logger.log("RTM metadata updated:", metadata);
            setUserMetadata(metadata);
          },
          (lock) => {
            logger.log("Note lock changed:", lock);
            setNoteLock({
              userId: lock.userId,
              displayName: lock.displayName
            });
          },
          (content, userId) => {
            logger.log("Note updated by:", userId);
            setNoteContent(content);
          }
        );

        if (rtmSuccess) {
          rtmManagerRef.current = rtmManager;
          logger.log("✅ Successfully initialized RTM");
        } else {
          logger.warn("⚠️ RTM initialization failed, continuing without it");
        }
      } catch (error) {
        logger.error("❌ Error initializing Agora:", error);
        setIsConnected(false);
        hasInitializedRef.current = false;
      } finally {
        isInitializingRef.current = false;
      }
    };

    initAgora();

    return () => {
      logger.log('Cleanup effect triggered');
      if (hasInitializedRef.current) {
        leaveChannel();
        hasInitializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinChannel = useCallback(async () => {
    await joinStream();
  }, [joinStream]);

  const leaveChannel = useCallback(async () => {
    try {
      if (isScreenSharing) {
        setScreenSharingState({
          isActive: false,
          sharerUid: null,
        });
      }

      closeTrack(localVideoTrackRef.current);
      closeTrack(localAudioTrackRef.current);
      closeTrack(localScreenTrackRef.current);

      localVideoTrackRef.current = null;
      localAudioTrackRef.current = null;
      localScreenTrackRef.current = null;

      if (rtmManagerRef.current) {
        await rtmManagerRef.current.cleanup();
        rtmManagerRef.current = null;
      }

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      setIsConnected(false);

      logger.log("Left channel");
    } catch (error) {
      logger.error("Error leaving channel:", error);
    }
  }, [isScreenSharing]);

  const toggleMicrophone = useCallback(async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(isMicMuted);
      setIsMicMuted(!isMicMuted);
    }
  }, [isMicMuted]);

  const toggleCamera = useCallback(async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  }, [isCameraOff]);

  const startScreenShare = useCallback(async () => {
    if (!clientRef.current || isScreenSharing) return false;

    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: "1080p_1",
        },
        "auto"
      );

      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
      localScreenTrackRef.current = videoTrack;

      // Replace camera video with screen share
      if (localVideoTrackRef.current && !isCameraOff) {
        await clientRef.current.unpublish([localVideoTrackRef.current]);
      }

      await clientRef.current.publish([videoTrack]);
      playVideoTrack(videoTrack, `user-${uid}`);

      setIsScreenSharing(true);

      if (rtmManagerRef.current) {
        await rtmManagerRef.current.updateScreenSharingStatus(true);
      }

      setScreenSharingState({
        isActive: true,
        sharerUid: uid,
      });

      logger.log("Started screen sharing - displaying in video tile");
      return true;
    } catch (error) {
      logger.error("Error starting screen share:", error);
      setIsScreenSharing(false);
      return false;
    }
  }, [isScreenSharing, isCameraOff, uid]);

  const stopScreenShare = useCallback(async () => {
    if (!clientRef.current || !isScreenSharing) return false;

    try {
      if (localScreenTrackRef.current) {
        localScreenTrackRef.current.stop();
        await clientRef.current.unpublish([localScreenTrackRef.current]);
        localScreenTrackRef.current.close();
        localScreenTrackRef.current = null;
      }

      setIsScreenSharing(false);

      if (rtmManagerRef.current) {
        await rtmManagerRef.current.updateScreenSharingStatus(false);
      }

      setScreenSharingState({
        isActive: false,
        sharerUid: null,
      });

      // Resume publishing camera video if it was on
      const videoTrack = localVideoTrackRef.current;
      if (videoTrack && !isCameraOff) {
        await clientRef.current.publish([videoTrack]);
        playVideoTrack(videoTrack, `user-${uid}`);
      }

      logger.log("Stopped screen sharing - back to camera");
      return true;
    } catch (error) {
      logger.error("Error stopping screen share:", error);
      return false;
    }
  }, [isScreenSharing, isCameraOff, uid]);

  const getUserDisplayName = useCallback((userId: string | number): string => {
    const metadata = userMetadata.get(userId);
    return metadata?.displayName || `User ${userId}`;
  }, [userMetadata]);

  const acquireNoteLock = useCallback(async () => {
    if (rtmManagerRef.current) {
      await rtmManagerRef.current.acquireNoteLock(displayName);
    }
  }, [displayName]);

  const releaseNoteLock = useCallback(async () => {
    if (rtmManagerRef.current) {
      await rtmManagerRef.current.releaseNoteLock();
    }
  }, []);

  const sendNoteUpdate = useCallback(async (content: string) => {
    if (rtmManagerRef.current) {
      await rtmManagerRef.current.sendNoteUpdate(content);
    }
  }, []);

  return {
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    remoteUsers,
    isConnected,
    screenSharingState,
    localVideoTrack: localVideoTrackRef.current,
    localScreenTrack: localScreenTrackRef.current,
    uid,
    userMetadata,
    noteContent,
    noteLock,
    joinChannel,
    leaveChannel,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    getUserDisplayName,
    acquireNoteLock,
    releaseNoteLock,
    sendNoteUpdate,
  };
}