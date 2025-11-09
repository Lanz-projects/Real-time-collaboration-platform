import { useState } from 'react';
import { LandingPage } from './components/landing-page';
import { MainRoom } from './components/main-room';

type AppState = 'landing' | 'room';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [roomData, setRoomData] = useState({
    roomId: '',
    roomCode: '',
    displayName: '',
    password: '',
    isCreator: false
  });

  const handleJoinRoom = (roomId: string, roomCode: string, displayName: string, password?: string) => {
    // Store display name in sessionStorage for persistence
    sessionStorage.setItem('display_name', displayName);
    
    // Combine roomId and roomCode to create the full Agora channel ID
    const fullChannelId = `${roomId}#${roomCode}`;
    
    setRoomData({ 
      roomId: fullChannelId,  // Full channel ID for Agora
      roomCode,               // Keep code for display
      displayName, 
      password: password || '', 
      isCreator: false 
    });
    setCurrentState('room');
  };

  const handleCreateRoom = (roomId: string, roomCode: string, displayName: string, password?: string) => {
    // Store display name in sessionStorage for persistence
    sessionStorage.setItem('display_name', displayName);
    
    // Combine roomId and roomCode to create the full Agora channel ID
    const fullChannelId = `${roomId}#${roomCode}`;
    
    setRoomData({ 
      roomId: fullChannelId,  // Full channel ID for Agora
      roomCode,               // Keep code for display
      displayName, 
      password: password || '', 
      isCreator: true 
    });
    setCurrentState('room');
  };

  const handleLeaveRoom = () => {
    setCurrentState('landing');
    setRoomData({ roomId: '', roomCode: '', displayName: '', password: '', isCreator: false });
  };

  return (
    <div className="w-full h-full">
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      {currentState === 'landing' ? (
        <LandingPage onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} />
      ) : (
        <MainRoom
          roomId={roomData.roomId}      // Full channel ID (e.g., "Hello#1697")
          roomCode={roomData.roomCode}  // Just the code for display (e.g., "1697")
          displayName={roomData.displayName}
          isCreator={roomData.isCreator}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}