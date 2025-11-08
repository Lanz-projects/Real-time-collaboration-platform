import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface LandingPageProps {
  onJoinRoom: (
    roomId: string,
    roomCode: string,
    displayName: string
  ) => void;
  onCreateRoom: (
    roomId: string,
    roomCode: string,
    displayName: string
  ) => void;
}

// Agora channel names exclude: . * / \ and non-printable ASCII characters
const ALLOWED_CHARS =
  'abcdefghijklmnopqrstuvwxyz' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  '0123456789' +
  '!#$%&()+,-:;<=>?@[]^_{|}~` ' +
  '';

const generateRoomCode = (): string => {
  const length = Math.floor(Math.random() * 5) + 4;
  let code = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }

  if (code.startsWith('_')) {
    code = ALLOWED_CHARS[Math.floor(Math.random() * 62)] + code.slice(1);
  }

  return code;
};

const validateRoomCode = (code: string): { isValid: boolean; error?: string } => {
  if (!code || code.length === 0) {
    return { isValid: false, error: 'Room code cannot be empty' };
  }

  if (code.length < 4 || code.length > 8) {
    return { isValid: false, error: 'Room code must be 4-8 characters' };
  }

  if (code.startsWith('_')) {
    return { isValid: false, error: 'Room code cannot start with underscore' };
  }

  for (let char of code) {
    if (!ALLOWED_CHARS.includes(char)) {
      return { isValid: false, error: `Character '${char}' is not allowed` };
    }
  }

  return { isValid: true };
};

const validateRoomId = (id: string): { isValid: boolean; error?: string } => {
  if (!id || id.length === 0) {
    return { isValid: false, error: 'Room ID cannot be empty' };
  }

  if (id.length > 25) {
    return { isValid: false, error: 'Room ID must be 25 characters or less' };
  }

  if (id.startsWith('_')) {
    return { isValid: false, error: 'Room ID cannot start with underscore' };
  }

  for (let char of id) {
    if (!ALLOWED_CHARS.includes(char)) {
      return { isValid: false, error: `Character '${char}' is not allowed` };
    }
  }

  return { isValid: true };
};

export function LandingPage({ onJoinRoom, onCreateRoom }: LandingPageProps) {
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("");
  const [joinCodeError, setJoinCodeError] = useState("");
  const [joinRoomIdError, setJoinRoomIdError] = useState("");

  const [createRoomId, setCreateRoomId] = useState("");
  const [generatedRoomCode, setGeneratedRoomCode] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createCodeError, setCreateCodeError] = useState("");
  const [createRoomIdError, setCreateRoomIdError] = useState("");

  useEffect(() => {
    setGeneratedRoomCode(generateRoomCode());

    const savedDisplayName = sessionStorage.getItem('display_name');
    if (savedDisplayName) {
      setJoinDisplayName(savedDisplayName);
      setCreateDisplayName(savedDisplayName);
    }
  }, []);

  const handleJoinRoomIdChange = (value: string) => {
    setJoinRoomId(value);

    if (value.length > 0) {
      const validation = validateRoomId(value);
      if (!validation.isValid) {
        setJoinRoomIdError(validation.error || '');
      } else {
        setJoinRoomIdError('');
      }
    } else {
      setJoinRoomIdError('');
    }
  };

  const handleJoinRoomCodeChange = (value: string) => {
    setJoinRoomCode(value);

    if (value.length > 0) {
      const validation = validateRoomCode(value);
      if (!validation.isValid) {
        setJoinCodeError(validation.error || '');
      } else {
        setJoinCodeError('');
      }
    } else {
      setJoinCodeError('');
    }
  };

  const handleCreateRoomIdChange = (value: string) => {
    setCreateRoomId(value);

    if (value.length > 0) {
      const validation = validateRoomId(value);
      if (!validation.isValid) {
        setCreateRoomIdError(validation.error || '');
      } else {
        setCreateRoomIdError('');
      }
    } else {
      setCreateRoomIdError('');
    }
  };

  const handleCreateRoomCodeChange = (value: string) => {
    setGeneratedRoomCode(value);

    if (value.length > 0) {
      const validation = validateRoomCode(value);
      if (!validation.isValid) {
        setCreateCodeError(validation.error || '');
      } else {
        setCreateCodeError('');
      }
    } else {
      setCreateCodeError('');
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (joinRoomId.trim() && joinRoomCode.trim() && joinDisplayName.trim()) {
      const idValidation = validateRoomId(joinRoomId.trim());
      if (!idValidation.isValid) {
        setJoinRoomIdError(idValidation.error || 'Invalid room ID');
        return;
      }

      const codeValidation = validateRoomCode(joinRoomCode.trim());
      if (!codeValidation.isValid) {
        setJoinCodeError(codeValidation.error || 'Invalid room code');
        return;
      }

      onJoinRoom(
        joinRoomId.trim(),
        joinRoomCode.trim(),
        joinDisplayName.trim()
      );
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (createRoomId.trim() && generatedRoomCode.trim() && createDisplayName.trim()) {
      const idValidation = validateRoomId(createRoomId.trim());
      if (!idValidation.isValid) {
        setCreateRoomIdError(idValidation.error || 'Invalid room ID');
        return;
      }

      const codeValidation = validateRoomCode(generatedRoomCode.trim());
      if (!codeValidation.isValid) {
        setCreateCodeError(codeValidation.error || 'Invalid room code');
        return;
      }

      onCreateRoom(
        createRoomId.trim(),
        generatedRoomCode.trim(),
        createDisplayName.trim()
      );
    }
  };

  const regenerateCode = () => {
    setGeneratedRoomCode(generateRoomCode());
    setCreateCodeError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-semibold text-gray-900 mb-2">
              Video Collaboration
            </CardTitle>
            <p className="text-gray-600 text-base">
              Connect and collaborate with your team
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs defaultValue="join" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="join" className="rounded-md">
                  Join a Room
                </TabsTrigger>
                <TabsTrigger value="create" className="rounded-md">
                  Create a Room
                </TabsTrigger>
              </TabsList>

              <TabsContent value="join" className="mt-2">
                <form onSubmit={handleJoinSubmit} className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <Label
                        htmlFor="joinRoomId"
                        className="text-sm font-medium text-gray-700"
                      >
                        Room ID
                      </Label>
                      <Input
                        id="joinRoomId"
                        type="text"
                        placeholder="Enter room name"
                        value={joinRoomId}
                        onChange={(e) => handleJoinRoomIdChange(e.target.value)}
                        maxLength={25}
                        required
                        className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {joinRoomIdError && (
                        <p className="text-xs text-red-600 mt-1">{joinRoomIdError}</p>
                      )}
                    </div>
                    <div className="w-32 space-y-3">
                      <Label
                        htmlFor="joinRoomCode"
                        className="text-sm font-medium text-gray-700"
                      >
                        Room Code
                      </Label>
                      <Input
                        id="joinRoomCode"
                        type="text"
                        placeholder="Code"
                        maxLength={8}
                        value={joinRoomCode}
                        onChange={(e) => handleJoinRoomCodeChange(e.target.value)}
                        required
                        className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-center font-mono"
                      />
                      {joinCodeError && (
                        <p className="text-xs text-red-600 mt-1">{joinCodeError}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="joinDisplayName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Display Name
                    </Label>
                    <Input
                      id="joinDisplayName"
                      type="text"
                      placeholder="Your name"
                      value={joinDisplayName}
                      onChange={(e) => setJoinDisplayName(e.target.value)}
                      required
                      className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    size="lg"
                  >
                    Join Room
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="create" className="mt-2">
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <Label
                        htmlFor="createRoomId"
                        className="text-sm font-medium text-gray-700"
                      >
                        Room ID
                      </Label>
                      <Input
                        id="createRoomId"
                        type="text"
                        placeholder="Name your room"
                        value={createRoomId}
                        onChange={(e) => handleCreateRoomIdChange(e.target.value)}
                        maxLength={25}
                        required
                        className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {createRoomIdError && (
                        <p className="text-xs text-red-600 mt-1">{createRoomIdError}</p>
                      )}
                    </div>
                    <div className="w-36 space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Room Code
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={generatedRoomCode}
                          onChange={(e) => handleCreateRoomCodeChange(e.target.value)}
                          maxLength={8}
                          placeholder="Code"
                          className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-center font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={regenerateCode}
                          className="h-11 px-3 border-gray-300 hover:bg-gray-50"
                          title="Generate random code"
                        >
                          ↻
                        </Button>
                      </div>
                      {createCodeError && (
                        <p className="text-xs text-red-600 mt-1">{createCodeError}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="createDisplayName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Display Name
                    </Label>
                    <Input
                      id="createDisplayName"
                      type="text"
                      placeholder="Your name"
                      value={createDisplayName}
                      onChange={(e) => setCreateDisplayName(e.target.value)}
                      required
                      className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    size="lg"
                  >
                    Create Room
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}