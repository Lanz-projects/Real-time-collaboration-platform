import AgoraRTM from 'agora-rtm-sdk';
import { logger } from '../../utils/logger';

export interface UserMetadata {
  uid: string | number;
  displayName: string;
  isScreenSharing?: boolean;
}

export interface RTMConfig {
  appId: string;
  userId: string;
  channelName: string;
  displayName: string;
  token?: string;
}

/**
 * Agora RTM (Real-Time Messaging) Manager
 *
 * This class manages real-time messaging between participants in a session.
 * RTM is used for signaling and coordination, not for media streams.
 *
 * Key responsibilities:
 * - Broadcasting user metadata (display names, screen sharing status)
 * - Coordinating shared note editing locks (prevents simultaneous editing)
 * - Syncing note content updates across participants
 *
 * Message Types:
 * - USER_METADATA: Announces user info when joining or status changes
 * - NOTE_LOCK_ACQUIRED: Signals when a user starts editing notes
 * - NOTE_LOCK_RELEASED: Signals when a user stops editing notes
 * - NOTE_UPDATE: Broadcasts note content changes to all participants
 */
export class AgoraRTMManager {
  private config: RTMConfig;
  private rtmClient: any;
  private userMetadataMap: Map<string | number, UserMetadata> = new Map();
  private onUserMetadataUpdate?: (metadata: Map<string | number, UserMetadata>) => void;
  private onNoteLockChange?: (lock: { userId: string | null; displayName: string | null; isLocked: boolean }) => void;
  private onNoteUpdate?: (content: string, userId: string) => void;

  constructor(config: RTMConfig) {
    this.config = config;
  }

  async initialize(
    onUserMetadataUpdate: (metadata: Map<string | number, UserMetadata>) => void,
    onNoteLockChange?: (lock: { userId: string | null; displayName: string | null; isLocked: boolean }) => void,
    onNoteUpdate?: (content: string, userId: string) => void
  ) {
    this.onUserMetadataUpdate = onUserMetadataUpdate;
    this.onNoteLockChange = onNoteLockChange;
    this.onNoteUpdate = onNoteUpdate;

    try {
      // Handle different export styles from Agora RTM SDK
      let RTMConstructor;
      if (AgoraRTM && typeof AgoraRTM === 'object' && 'RTM' in AgoraRTM) {
        RTMConstructor = (AgoraRTM as { RTM: any }).RTM;
      } else {
        RTMConstructor = AgoraRTM;
      }

      this.rtmClient = new RTMConstructor(this.config.appId, this.config.userId);

      this.setupEventListeners();

      logger.log('Attempting RTM login...');
      logger.log('App ID:', this.config.appId);
      logger.log('User ID:', this.config.userId);
      logger.log('Token provided:', !!this.config.token);

      if (this.config.token) {
        await this.rtmClient.login({ token: this.config.token });
      } else {
        await this.rtmClient.login();
      }

      logger.log('✅ RTM login successful');

      const subscribeOptions = {
        withMessage: true,
        withPresence: true,
      };

      await this.rtmClient.subscribe(this.config.channelName, subscribeOptions);
      logger.log('✅ RTM channel subscription successful');

      setTimeout(() => {
        this.publishOwnMetadata();
      }, 500);

      return true;
    } catch (error: any) {
      logger.error('❌ RTM initialization error:', error);
      logger.error('Error code:', error?.code);
      logger.error('Error message:', error?.message);
      logger.error('Error details:', error);
      return false;
    }
  }

  private setupEventListeners() {
    this.rtmClient.addEventListener('message', (event: any) => {
      logger.log('RTM message received:', event);

      try {
        const metadata = JSON.parse(event.message);
        if (metadata.type === 'USER_METADATA') {
          this.updateUserMetadata(event.publisher, metadata.data);
        }
        else if (metadata.type === 'NOTE_LOCK_ACQUIRED') {
          if (this.onNoteLockChange) {
            this.onNoteLockChange({
              userId: metadata.data.userId,
              displayName: metadata.data.displayName,
              isLocked: true
            });
          }
        }
        else if (metadata.type === 'NOTE_LOCK_RELEASED') {
          if (this.onNoteLockChange) {
            this.onNoteLockChange({
              userId: null,
              displayName: null,
              isLocked: false
            });
          }
        }
        else if (metadata.type === 'NOTE_UPDATE') {
          if (this.onNoteUpdate) {
            this.onNoteUpdate(metadata.data.content, metadata.data.userId);
          }
        }
      } catch (error) {
        logger.error('Error parsing RTM message:', error);
      }
    });

    this.rtmClient.addEventListener('presence', (event: any) => {
      logger.log('RTM presence event:', event);

      if (event.eventType === 'SNAPSHOT') {
        logger.log('Snapshot - publishing metadata');
        this.publishOwnMetadata();
      } else if (event.eventType === 'REMOTE_JOIN') {
        logger.log(`User ${event.publisher} joined`);
        setTimeout(() => {
          this.publishOwnMetadata();
        }, 100);
      } else if (event.eventType === 'REMOTE_LEAVE') {
        logger.log(`User ${event.publisher} left`);
        this.userMetadataMap.delete(event.publisher);
        this.notifyUpdate();
      }
    });

    this.rtmClient.addEventListener('status', (event: any) => {
      logger.log('RTM status:', event.state, 'reason:', event.reason);
    });
  }

  private async publishOwnMetadata() {
    const metadata: UserMetadata = {
      uid: this.config.userId,
      displayName: this.config.displayName,
      isScreenSharing: false,
    };

    this.updateUserMetadata(this.config.userId, metadata);

    const payload = {
      type: 'USER_METADATA',
      data: metadata,
    };
    const message = JSON.stringify(payload);

    const publishOptions = {
      channelType: 'MESSAGE',
    };

    try {
      const result = await this.rtmClient.publish(
        this.config.channelName,
        message,
        publishOptions
      );
      logger.log('✅ Published metadata:', metadata, result);
    } catch (error) {
      logger.error('❌ Error publishing metadata:', error);
    }
  }

  async updateScreenSharingStatus(isScreenSharing: boolean) {
    const metadata: UserMetadata = {
      uid: this.config.userId,
      displayName: this.config.displayName,
      isScreenSharing,
    };

    this.updateUserMetadata(this.config.userId, metadata);

    const payload = {
      type: 'USER_METADATA',
      data: metadata,
    };
    const message = JSON.stringify(payload);

    const publishOptions = {
      channelType: 'MESSAGE',
    };

    try {
      const result = await this.rtmClient.publish(
        this.config.channelName,
        message,
        publishOptions
      );
      logger.log('Updated screen sharing:', isScreenSharing, result);
    } catch (error) {
      logger.error('Error updating screen sharing:', error);
    }
  }

  private updateUserMetadata(userId: string | number, metadata: UserMetadata) {
    this.userMetadataMap.set(userId, metadata);
    this.notifyUpdate();
  }

  private notifyUpdate() {
    if (this.onUserMetadataUpdate) {
      this.onUserMetadataUpdate(new Map(this.userMetadataMap));
    }
  }

  getUserMetadata(userId: string | number): UserMetadata | undefined {
    return this.userMetadataMap.get(userId);
  }

  getAllUserMetadata(): Map<string | number, UserMetadata> {
    return new Map(this.userMetadataMap);
  }

  async acquireNoteLock(displayName: string) {
    const message = JSON.stringify({
      type: 'NOTE_LOCK_ACQUIRED',
      data: { 
        userId: this.config.userId, 
        displayName,
        timestamp: Date.now()
      }
    });

    const publishOptions = {
      channelType: 'MESSAGE',
    };

    try {
      const result = await this.rtmClient.publish(
        this.config.channelName,
        message,
        publishOptions
      );
      logger.log('Note lock acquired:', result);
    } catch (error) {
      logger.error('Error acquiring note lock:', error);
    }
  }

  async releaseNoteLock() {
    const message = JSON.stringify({
      type: 'NOTE_LOCK_RELEASED',
      data: { 
        userId: this.config.userId,
        timestamp: Date.now()
      }
    });

    const publishOptions = {
      channelType: 'MESSAGE',
    };

    try {
      const result = await this.rtmClient.publish(
        this.config.channelName,
        message,
        publishOptions
      );
      logger.log('Note lock released:', result);
    } catch (error) {
      logger.error('Error releasing note lock:', error);
    }
  }

  async sendNoteUpdate(content: string) {
    const message = JSON.stringify({
      type: 'NOTE_UPDATE',
      data: { 
        content,
        userId: this.config.userId,
        timestamp: Date.now()
      }
    });

    const publishOptions = {
      channelType: 'MESSAGE',
    };

    try {
      await this.rtmClient.publish(
        this.config.channelName,
        message,
        publishOptions
      );
      logger.log('Note update sent');
    } catch (error) {
      logger.error('Error sending note update:', error);
    }
  }

  async cleanup() {
    try {
      if (this.rtmClient) {
        await this.rtmClient.unsubscribe(this.config.channelName);
        await this.rtmClient.logout();
        logger.log('RTM cleanup successful');
      }
    } catch (error) {
      logger.error('RTM cleanup error:', error);
    }
  }
}