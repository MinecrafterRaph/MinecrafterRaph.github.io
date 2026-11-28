import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface VoiceMessagePlayerProps {
  id: string;
  duration?: number;
  isMe: boolean;
  avatar?: string;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  duration = 15,
  isMe,
  avatar,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const intervalRef = useRef<number | null>(null);

  // Generate a consistent pseudo-random waveform pattern based on duration
  const barsCount = 28;
  const waveformHeights = useRef<number[]>(
    Array.from({ length: barsCount }, (_, i) => {
      // Pleasant rhythmic speech waveform pattern
      const base = 25 + Math.sin(i * 0.8) * 35 + ((i % 3) * 15);
      return Math.max(18, Math.min(95, Math.round(base)));
    })
  ).current;

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackRate((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  useEffect(() => {
    if (isPlaying) {
      const stepMs = 100;
      const totalMs = (duration * 1000) / playbackRate;
      const increment = stepMs / totalMs;

      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + increment;
        });
      }, stepMs);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, duration, playbackRate]);

  const currentSeconds = Math.floor(progress * duration);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 min-w-[240px] max-w-[300px]">
      {/* Avatar with Mic indicator */}
      {!isMe && (
        <div className="relative shrink-0">
          <WhatsAppAvatar
            avatarUrl={avatar}
            size="sm"
          />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00a884] rounded-full flex items-center justify-center text-white text-[8px]">
            <Mic className="w-2 h-2" />
          </div>
        </div>
      )}

      {/* Play / Pause button */}
      <button
        type="button"
        id={`voice-play-${duration}`}
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          isMe
            ? 'bg-[#00a884] text-white hover:bg-[#008f70]'
            : 'bg-[#54656f] text-white hover:bg-[#3b4a54]'
        }`}
        title={isPlaying ? 'Pause' : 'Abspielen'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Duration */}
      <div className="flex-1 flex flex-col justify-center">
        <div
          className="flex items-center gap-[2.5px] h-7 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            setProgress(Math.max(0, Math.min(1, clickPos)));
          }}
        >
          {waveformHeights.map((h, idx) => {
            const barProgress = idx / barsCount;
            const isFilled = barProgress <= progress;
            return (
              <span
                key={idx}
                className={`w-[2.5px] rounded-full transition-all duration-75 ${
                  isFilled
                    ? isMe
                      ? 'bg-[#00a884]'
                      : 'bg-[#54656f]'
                    : 'bg-[#00000020]'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#667781] mt-0.5">
          <span>{isPlaying ? formatTime(currentSeconds) : formatTime(duration)}</span>
          <button
            type="button"
            onClick={handleSpeedToggle}
            className="px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 font-semibold text-[10px] text-[#54656f] transition-colors"
            title="Wiedergabegeschwindigkeit ändern"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
