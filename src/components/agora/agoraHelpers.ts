import { logger } from "../../utils/logger";

/**
 * Get or generate a unique user ID for the session
 * Stores the UID in sessionStorage to maintain consistency across page refreshes
 */
export function getUid(): string {
  let uid = sessionStorage.getItem("uid");
  if (!uid) {
    uid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem("uid", uid);
  }
  return uid;
}

/**
 * Play a video track in a specific container element
 */
export function playVideoTrack(
  track: any,
  containerId: string,
  delay: number = 100
): void {
  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container && track) {
      track.play(container);
    }
  }, delay);
}

/**
 * Stop and close a media track safely
 */
export function closeTrack(track: any): void {
  if (track) {
    try {
      track.stop();
      track.close();
    } catch (error) {
      logger.error("Error closing track:", error);
    }
  }
}