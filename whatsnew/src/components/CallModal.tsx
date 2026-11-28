import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Shield,
  Maximize2,
  Minimize2,
  Server,
} from 'lucide-react';
import { WhatsAppAvatar } from './WhatsAppAvatar';
import { CallConfig } from '../types';

interface CallModalProps {
  isOpen: boolean;
  chatId: string;
  contactName: string;
  contactAvatar: string;
  callType: 'voice' | 'video';
  callConfig?: CallConfig;
  onEndCall: (durationSeconds: number) => void;
  onOpenConfig?: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  chatId,
  contactName,
  contactAvatar,
  callType: initialCallType,
  callConfig,
  onEndCall,
  onOpenConfig,
}) => {
  const [callType, setCallType] = useState<'voice' | 'video'>(initialCallType);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(initialCallType === 'voice');
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync callType if prop changes
  useEffect(() => {
    setCallType(initialCallType);
    setIsVideoOff(initialCallType === 'voice');
  }, [initialCallType]);

  // Handle call states and simulated ring/connect
  useEffect(() => {
    if (!isOpen) {
      setCallStatus('connecting');
      setDuration(0);
      stopMediaTracks();
      return;
    }

    // Play ringing sound with Web Audio API
    playRingtone();

    const timer1 = setTimeout(() => {
      setCallStatus('ringing');
    }, 1200);

    const timer2 = setTimeout(() => {
      setCallStatus('connected');
      stopRingtone();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      stopRingtone();
      stopMediaTracks();
    };
  }, [isOpen]);

  // Duration timer when connected
  useEffect(() => {
    let interval: any;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Camera video stream setup
  useEffect(() => {
    if (isOpen && callType === 'video' && !isVideoOff) {
      startCamera();
    } else {
      stopMediaTracks();
    }
    return () => {
      stopMediaTracks();
    };
  }, [isOpen, callType, isVideoOff]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Could not access camera/microphone directly:', err);
    }
  };

  const stopMediaTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Ringtone synthesizer
  const playRingtone = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const playTone = (freq1: number, freq2: number, startTime: number, dur: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = freq1;
        osc2.frequency.value = freq2;

        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + dur);
        osc2.stop(startTime + dur);
      };

      // Ringing pattern
      const now = ctx.currentTime;
      playTone(440, 480, now + 0.1, 1.2);
      playTone(440, 480, now + 2.0, 1.2);
    } catch (e) {
      // AudioContext might be restricted until user interaction
    }
  };

  const stopRingtone = () => {
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  const handleHangup = () => {
    setCallStatus('ended');
    stopRingtone();
    stopMediaTracks();
    setTimeout(() => {
      onEndCall(duration);
    }, 600);
  };

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-6 select-none animate-in fade-in duration-300 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`relative w-full overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300 ${
          isFullscreen
            ? 'h-full w-full rounded-none'
            : 'max-w-2xl h-[580px] rounded-3xl border border-white/10'
        } bg-gradient-to-b from-[#1f2c34] via-[#121b22] to-[#0b141a] text-white`}
      >
        {/* Top Header Controls */}
        <div className="relative z-10 p-5 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-[#00a884]">
              <Shield className="w-3.5 h-3.5" />
              <span>Ende-zu-Ende verschlüsselt</span>
            </div>
            {callConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-[11px] text-white/70 hover:text-white transition-colors"
                title="Cloud-Konfiguration anpassen"
              >
                <Server className="w-3 h-3 text-[#00a884]" />
                <span className="truncate max-w-[120px]">
                  {callConfig.provider === 'demo'
                    ? 'Integrierte Demo'
                    : callConfig.serverUrl || 'Eigene Cloud'}
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title={isFullscreen ? 'Verkleinern' : 'Vollbild'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Video Area (if video call active) */}
        {callType === 'video' && !isVideoOff ? (
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Remote Simulated Stream / Avatar Overlay */}
            <div className="absolute top-6 right-6 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-[#202c33] flex flex-col items-center justify-center p-3 text-center">
              <WhatsAppAvatar avatarUrl={contactAvatar} size="md" />
              <p className="text-xs font-medium mt-2 truncate w-full">{contactName}</p>
            </div>
          </div>
        ) : null}

        {/* Center: Contact Info & Status */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 -mt-10">
          {(!isVideoOff && callType === 'video') ? null : (
            <div className="relative mb-6">
              {/* Pulse rings when ringing */}
              {callStatus === 'ringing' && (
                <div className="absolute -inset-4 rounded-full bg-[#00a884]/20 animate-ping pointer-events-none" />
              )}
              <div className="relative rounded-full ring-4 ring-white/10 shadow-2xl overflow-hidden">
                <WhatsAppAvatar avatarUrl={contactAvatar} size="xl" />
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5 drop-shadow-md">
            {contactName}
          </h2>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium transition-colors ${
                callStatus === 'connected' ? 'text-[#00a884]' : 'text-white/70'
              }`}
            >
              {callStatus === 'connecting' && 'Verbinde mit eigener Cloud...'}
              {callStatus === 'ringing' && 'Klingelt...'}
              {callStatus === 'connected' && formatDuration(duration)}
              {callStatus === 'ended' && 'Anruf beendet'}
            </span>
          </div>

          <p className="text-xs text-white/50 mt-1">
            {callType === 'video' ? 'WhatsApp Videoanruf' : 'WhatsApp Sprachanruf'}
          </p>
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="relative z-10 p-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
          <div className="flex items-center gap-3 md:gap-5 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Toggle Mic */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full transition-all ${
                isMuted
                  ? 'bg-red-500/80 text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isMuted ? 'Mikrofon einschalten' : 'Mikrofon stummschalten'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Toggle Video */}
            <button
              type="button"
              onClick={() => {
                if (callType === 'voice') {
                  setCallType('video');
                  setIsVideoOff(false);
                } else {
                  setIsVideoOff(!isVideoOff);
                }
              }}
              className={`p-3.5 rounded-full transition-all ${
                isVideoOff || callType === 'voice'
                  ? 'bg-white/15 hover:bg-white/25 text-white/70 hover:text-white'
                  : 'bg-[#00a884] text-white shadow-lg'
              }`}
              title={isVideoOff ? 'Kamera einschalten' : 'Kamera ausschalten'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-full transition-all ${
                !isSpeakerOn
                  ? 'bg-red-500/80 text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isSpeakerOn ? 'Lautsprecher stummschalten' : 'Lautsprecher an'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Hangup Red Button */}
            <button
              type="button"
              onClick={handleHangup}
              className="p-4 rounded-full bg-[#ea0038] hover:bg-[#c9002f] text-white shadow-lg shadow-red-500/30 transition-transform hover:scale-105 active:scale-95 ml-2"
              title="Auflegen"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
