import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

interface TelemedicineProps {
  roomName: string;
  userName: string;
  userRole: 'doctor' | 'patient';
  onConsultationEnd: () => void;
}

export default function TelemedicineConsultation({ 
  roomName, 
  userName, 
  userRole, 
  onConsultationEnd 
}: TelemedicineProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [consultationTime, setConsultationTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Get video token
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/twilio/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_token',
            roomName,
            identity: userName,
            role: userRole === 'doctor' ? 'host' : 'participant'
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setToken(data.token);
          // Initialize video connection
          initializeVideoRoom(data.token);
        } else {
          setError('Failed to get video token');
        }
      } catch (err) {
        setError('Failed to connect to video service');
      }
    };

    fetchToken();
    
    // Start consultation timer
    timerRef.current = setInterval(() => {
      setConsultationTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [roomName, userName, userRole]);

  const initializeVideoRoom = async (videoToken: string) => {
    try {
      // This would typically use Twilio Video SDK
      // For demo purposes, we'll simulate connection
      console.log('Initializing video room with token:', videoToken);
      
      // Simulate connection delay
      setTimeout(() => {
        setIsConnected(true);
        setParticipants([
          { identity: userName, role: userRole, isLocal: true }
        ]);
      }, 2000);
    } catch (err) {
      setError('Failed to initialize video room');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In real implementation: localAudioTrack?.setEnabled(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // In real implementation: localVideoTrack?.setEnabled(!isVideoOff);
  };

  const toggleRecording = async () => {
    try {
      const response = await fetch('/api/twilio/recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRecording ? 'stop' : 'start',
          roomName
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsRecording(!isRecording);
      }
    } catch (err) {
      setError('Failed to toggle recording');
    }
  };

  const endConsultation = () => {
    setIsConnected(false);
    onConsultationEnd();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center">
          <span className="material-symbols-outlined text-red-600 text-6xl mb-4">error</span>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Telemedicine Consultation - Medical Records Center</title>
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Telemedicine Consultation</h1>
            <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
              {userRole === 'doctor' ? 'Dr. ' : ''}{userName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-mono">{formatTime(consultationTime)}</span>
            {isRecording && (
              <span className="flex items-center gap-2 text-red-500">
                <span className="material-symbols-outlined">fiber_manual_record</span>
                Recording
              </span>
            )}
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 flex">
          {/* Main Video */}
          <div className="flex-1 relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <span className="material-symbols-outlined text-gray-400 text-6xl">videocam_off</span>
                <p className="text-gray-400 mt-2">Camera is off</p>
              </div>
            )}
            
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-white">Connecting to consultation room...</p>
                </div>
              </div>
            )}
          </div>

          {/* Participants Sidebar */}
          <div className="w-80 bg-gray-800 p-4">
            <h3 className="text-white font-semibold mb-4">Participants ({participants.length})</h3>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">person</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{participant.identity}</p>
                    <p className="text-gray-400 text-sm">{participant.role}</p>
                  </div>
                  {participant.isLocal && (
                    <span className="text-blue-400 text-sm">You</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-white text-2xl">
                {isMuted ? 'mic_off' : 'mic'}
              </span>
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-white text-2xl">
                {isVideoOff ? 'videocam_off' : 'videocam'}
              </span>
            </button>
            
            <button
              onClick={toggleRecording}
              className={`p-4 rounded-full transition-colors ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-white text-2xl">
                {isRecording ? 'fiber_manual_record' : 'radio_button_unchecked'}
              </span>
            </button>
            
            <button
              onClick={endConsultation}
              className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-white text-2xl">call_end</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
