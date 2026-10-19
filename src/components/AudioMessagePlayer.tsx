import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, FastForward } from 'lucide-react';

interface AudioMessagePlayerProps {
  audioUrl?: string;
  durationSeconds?: number;
  isMe?: boolean;
  messageText?: string;
}

export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  audioUrl,
  durationSeconds = 0,
  isMe = false,
  messageText = 'Mensagem de voz',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(Math.round(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current && !audioUrl) {
      // Modos de simulação se não houver URL real
      setIsPlaying(!isPlaying);
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = playbackRate;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error('Erro ao reproduzir áudio:', err);
            setIsPlaying(true);
          });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = () => {
    const nextRate = playbackRate === 1.0 ? 1.5 : playbackRate === 1.5 ? 2.0 : 1.0;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const displayDuration = duration || 5;
  const progressPercent = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5 min-w-[210px] sm:min-w-[240px] py-0.5">
      <div className="flex items-center gap-3">
        {/* Play/Pause Circle Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-transform active:scale-90 ${
            isMe
              ? 'bg-white text-[#147A80] hover:bg-teal-50'
              : 'bg-[#147A80] text-white hover:bg-teal-700'
          }`}
          title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform & Timeline */}
        <div className="flex-1 flex flex-col gap-1">
          {/* Waveform Animation Bars */}
          <div className="flex items-center gap-0.5 h-5 px-0.5">
            {[40, 70, 30, 90, 60, 100, 45, 80, 35, 65, 85, 50, 95, 40, 75, 60, 30, 80].map(
              (heightPercent, idx) => {
                const isActive = (idx / 18) * 100 <= progressPercent;
                return (
                  <span
                    key={idx}
                    style={{ height: `${heightPercent}%` }}
                    className={`flex-1 rounded-full transition-all duration-150 ${
                      isActive
                        ? isMe
                          ? 'bg-white'
                          : 'bg-[#147A80]'
                        : isMe
                        ? 'bg-white/40'
                        : 'bg-slate-300'
                    } ${isPlaying && isActive ? 'animate-pulse' : ''}`}
                  />
                );
              }
            )}
          </div>

          {/* Time & Speed Controls */}
          <div className="flex items-center justify-between text-[10px] font-medium opacity-90 px-0.5">
            <span>
              {formatTime(currentTime)} / {formatTime(displayDuration)}
            </span>

            <button
              type="button"
              onClick={handleSpeedChange}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                isMe
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
              }`}
              title="Alterar velocidade de reprodução"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
