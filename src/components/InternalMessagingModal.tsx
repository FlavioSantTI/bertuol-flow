import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Stethoscope,
  ChevronRight,
  ArrowRightLeft,
  PlusCircle,
  Building2,
  Paperclip,
  Mic,
  MicOff,
  FileText,
  Trash2,
  Play,
  Pause,
  CornerDownLeft,
  Image as ImageIcon,
  CheckCheck,
  User,
  Phone,
  AlertCircle,
  Download,
  ExternalLink,
  Volume2,
  RotateCcw,
  Video as VideoIcon,
} from 'lucide-react';
import {
  Conversation,
  Message,
  ConversationParticipant,
  MediaType,
} from '../types/database';
import { messagingService } from '../services/messagingService';
import { MediaViewerModal } from './MediaViewerModal';
import { TEST_PATIENTS } from '../patient/PatientApp';

interface InternalMessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: {
    userId?: string;
    userName?: string;
    role: 'staff' | 'dentist' | 'admin' | string;
    dentistId?: number;
  };
  dentists: Array<{ id: number; Name: string; Specialty?: string }>;
  clinics: Array<{ id: number; name: string }>;
  selectedClinicId?: number | 'all';
}

// COMPONENTE DEDICADO DE REPRODUÇÃO DE ÁUDIO DE VOZ
// COMPONENTE DEDICADO DE REPRODUÇÃO DE ÁUDIO DE VOZ (SIMPLIFICADO NATIVO)
const AudioMessagePlayer: React.FC<{ url: string; durationSeconds?: number; isMe?: boolean }> = ({
  url,
  durationSeconds,
  isMe,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.error('[AudioMessagePlayer] Erro na reprodução do áudio:', e);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const finalDuration = duration || durationSeconds || 0;

  return (
    <div className="flex items-center gap-2.5 p-2 bg-black/20 rounded-xl w-full my-1 border border-white/10 shadow-xs">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (d && !isNaN(d) && isFinite(d) && d > 0) {
            setDuration(Math.round(d));
          }
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer ${
          isMe ? 'bg-white text-[#147A80] hover:bg-teal-50' : 'bg-[#147A80] text-white hover:bg-teal-700'
        }`}
        title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold opacity-90">
          <span>🎙️ Áudio de Voz</span>
          <span>
            {formatTime(currentTime)} {finalDuration > 0 ? `/ ${formatTime(finalDuration)}` : ''}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={finalDuration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-400"
        />
      </div>
    </div>
  );
};

// Detecção inteligente e estrita de mídias
function getEffectiveMedia(msg: Message) {
  let url = msg.media_url;
  let type = msg.media_type;

  // Extração de tag de mídia embutida no corpo [MEDIA_URL:...|TYPE:...]
  if (msg.body && msg.body.includes('[MEDIA_URL:')) {
    const urlMatch = msg.body.match(/\[MEDIA_URL:([^|\]\s]+)/i);
    if (urlMatch && urlMatch[1]) {
      url = urlMatch[1].trim();
    }
    const typeMatch = msg.body.match(/\|TYPE:([^\]\s]+)/i);
    if (typeMatch && typeMatch[1]) {
      type = typeMatch[1].trim() as any;
    }
  }

  if (!url && msg.body) {
    const urlMatch = msg.body.match(/(https?:\/\/[^\s]+|\/uploads\/[^\s]+|data:(image|audio|video|application)\/[^;]+;base64,[^\s]+)/i);
    if (urlMatch) {
      url = urlMatch[0];
    }
  }

  if (url) {
    const lowerUrl = url.toLowerCase();
    const lowerBody = (msg.body || '').toLowerCase();

    // Verificação de extensões de documento / PDF
    const isDocExt =
      type === 'document' ||
      lowerUrl.includes('.pdf') ||
      lowerUrl.includes('.doc') ||
      lowerUrl.includes('.docx') ||
      lowerUrl.includes('.xls') ||
      lowerUrl.includes('.xlsx') ||
      lowerUrl.includes('.txt') ||
      lowerUrl.includes('data:application') ||
      lowerUrl.includes('data:text');

    // Verificação de imagem
    const isImgExt =
      type === 'image' ||
      lowerUrl.includes('data:image') ||
      lowerUrl.includes('.png') ||
      lowerUrl.includes('.jpg') ||
      lowerUrl.includes('.jpeg') ||
      lowerUrl.includes('.webp') ||
      lowerUrl.includes('.gif') ||
      lowerUrl.includes('.svg');

    // Verificação de vídeo
    const isVidExt =
      type === 'video' ||
      lowerUrl.includes('data:video') ||
      lowerUrl.includes('.mp4') ||
      lowerUrl.includes('.avi') ||
      lowerUrl.includes('.mov');

    // Verificação estrita de áudio (NUNCA ser verdadeiro se for documento/pdf/imagem/vídeo)
    const isAudioExt =
      !isDocExt &&
      !isImgExt &&
      !isVidExt &&
      (
        type === 'audio' ||
        lowerUrl.includes('data:audio') ||
        lowerUrl.includes('.webm') ||
        lowerUrl.includes('.mp3') ||
        lowerUrl.includes('.wav') ||
        lowerUrl.includes('.m4a') ||
        lowerUrl.includes('.ogg') ||
        lowerBody.startsWith('🎙️') ||
        lowerBody.includes('mensagem de voz') ||
        lowerBody.includes('mensagem de áudio')
      );

    if (isDocExt) {
      type = 'document';
    } else if (isImgExt) {
      type = 'image';
    } else if (isVidExt) {
      type = 'video';
    } else if (isAudioExt) {
      type = 'audio';
    } else {
      type = 'document';
    }
  }

  return { url, type };
}

function cleanDisplayBody(bodyStr?: string, isAudioMessage?: boolean) {
  if (!bodyStr) return '';
  let text = bodyStr.replace(/\n?\[MEDIA_URL:[^\]]+\]/g, '').trim();
  if (isAudioMessage && (text.startsWith('🎙️') || text.includes('Mensagem de Voz') || text.includes('Mensagem de Áudio'))) {
    return '';
  }
  return text;
}

// Compressão de Imagem no Cliente
async function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<{ compressedFile: File; previewUrl: string }> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            const previewUrl = URL.createObjectURL(blob);
            resolve({ compressedFile, previewUrl });
          } else {
            resolve({ compressedFile: file, previewUrl: URL.createObjectURL(file) });
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      resolve({ compressedFile: file, previewUrl: URL.createObjectURL(file) });
    };

    img.src = objectUrl;
  });
}

function formatPhoneNumber(phone?: string) {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  return phone;
}

export const InternalMessagingModal: React.FC<InternalMessagingModalProps> = ({
  isOpen,
  onClose,
  userContext,
  dentists,
  clinics,
  selectedClinicId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'unassigned' | 'mine'>('all');
  const [modalClinicFilter, setModalClinicFilter] = useState<number | 'all'>(() => selectedClinicId || 'all');

  // Attachment state
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    url: string;
    type: MediaType;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Controles de Gravação de Voz Avançados
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showMicPermissionBanner, setShowMicPermissionBanner] = useState(false);

  const recordingTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sub-Modais
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [isNewConvModalOpen, setIsNewConvModalOpen] = useState(false);

  // Formulário de Nova Conversa
  const [newConvPatientName, setNewConvPatientName] = useState('');
  const [newConvPatientPhone, setNewConvPatientPhone] = useState('');
  const [newConvClinicId, setNewConvClinicId] = useState<number>(() => (typeof selectedClinicId === 'number' ? selectedClinicId : 1));
  const [newConvSubject, setNewConvSubject] = useState('');
  const [newConvMessage, setNewConvMessage] = useState('');

  // Player de Mídia Modal
  const [activeMediaView, setActiveMediaView] = useState<{
    isOpen: boolean;
    url: string;
    type: MediaType;
    title?: string;
  }>({
    isOpen: false,
    url: '',
    type: 'image',
  });

  const [newMessageText, setNewMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDentist = userContext.role === 'dentist';
  const currentDentistName = dentists.find((d) => d.id === userContext.dentistId)?.Name || userContext.userName;

  useEffect(() => {
    if (isOpen && selectedClinicId) {
      setModalClinicFilter(selectedClinicId);
      if (typeof selectedClinicId === 'number') {
        setNewConvClinicId(selectedClinicId);
      }
    }
  }, [isOpen, selectedClinicId]);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingList(true);
    try {
      const data = await messagingService.getConversations({
        clinicId: modalClinicFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        dentistName: isDentist ? currentDentistName : undefined,
        role: userContext.role,
        scope: scopeFilter === 'mine' ? 'assigned_only' : scopeFilter === 'unassigned' ? 'unassigned' : 'all',
      });
      setConversations(data || []);
      if (data && data.length > 0) {
        setSelectedConversationId((prev) => {
          if (prev && data.some((c: Conversation) => c.id === prev)) {
            return prev;
          }
          return data[0].id;
        });
      } else if (!silent) {
        setSelectedConversationId(null);
      }
    } catch (err) {
      console.error('[InternalMessaging] Erro ao carregar conversas:', err);
    } finally {
      if (!silent) setIsLoadingList(false);
    }
  }, [modalClinicFilter, statusFilter, scopeFilter, isDentist, currentDentistName, userContext.role]);

  const loadMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const data = await messagingService.getMessages(convId);
      if (data) {
        setMessages((prevMsgs) => {
          const tempMsgs = prevMsgs.filter((m) => m.id.startsWith('temp-'));
          const serverMsgs: Message[] = data.messages || [];
          
          const mergedMap = new Map<string, Message>();
          serverMsgs.forEach((sm: Message) => {
            const key = sm.client_message_id || sm.id;
            mergedMap.set(key, sm);
          });
          tempMsgs.forEach((tm: Message) => {
            const key = tm.client_message_id || tm.id;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, tm);
            }
          });

          return Array.from(mergedMap.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        setParticipants(data.participants || []);
        await messagingService.markAsRead(convId, 'staff');
      }
    } catch (err) {
      console.error('[InternalMessaging] Erro ao carregar mensagens:', err);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadConversations(false);
    }
  }, [isOpen, loadConversations]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      loadConversations(true);
      if (selectedConversationId) {
        loadMessages(selectedConversationId, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, selectedConversationId, loadConversations, loadMessages]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId, false);
    } else {
      setMessages([]);
      setParticipants([]);
    }
  }, [selectedConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gravação de Áudio Síncrona com MediaRecorder e Codec Adaptativo
  const startRecording = async () => {
    if (!selectedConversationId) {
      alert('Selecione uma conversa para iniciar a gravação de voz.');
      return;
    }

    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        alert('A gravação de microfone requer suporte a WebRTC no seu navegador.');
        return;
      }

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }

      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let usedMimeType = 'audio/webm';
      let mediaRecorder: MediaRecorder;

      try {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          usedMimeType = 'audio/webm;codecs=opus';
        } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm')) {
          usedMimeType = 'audio/webm';
        } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/mp4')) {
          usedMimeType = 'audio/mp4';
        } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/ogg')) {
          usedMimeType = 'audio/ogg';
        }
        mediaRecorder = new MediaRecorder(stream, usedMimeType ? { mimeType: usedMimeType } : undefined);
      } catch (recErr) {
        console.warn('[Recording] Fallback para MediaRecorder padrão:', recErr);
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const mime = mediaRecorder.mimeType || usedMimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mime });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioBlob(audioBlob);
          setRecordedAudioUrl(audioUrl);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('[Recording] Erro ao iniciar gravação:', err);
      setShowMicPermissionBanner(true);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    audioChunksRef.current = [];
    setRecordedAudioBlob(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
  };

  const sendVoiceNote = async () => {
    if (isRecording) {
      stopRecording();
      await new Promise((r) => setTimeout(r, 300));
    }

    const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlobToUpload = audioChunksRef.current.length > 0
      ? new Blob(audioChunksRef.current, { type: mime })
      : recordedAudioBlob;

    if (!audioBlobToUpload || !selectedConversationId) {
      alert('Selecione uma conversa e grave um áudio antes de enviar.');
      return;
    }

    try {
      setIsSending(true);
      const seconds = recordingSeconds > 0 ? recordingSeconds : 5;
      const extension = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm';
      const audioFile = new File([audioBlobToUpload], `audio_voz_${Date.now()}.${extension}`, {
        type: mime,
      });

      const uploaded = await messagingService.uploadMedia(audioFile, audioFile.name, 'audio', seconds);
      const mediaUrl = uploaded?.url || '';

      if (!mediaUrl) {
        alert('Falha ao processar o áudio no servidor. Tente novamente.');
        return;
      }

      await submitMessageWithContent(`🎙️ [Mensagem de Voz • 00:${seconds < 10 ? '0' + seconds : seconds}]`, {
        mediaUrl,
        mediaType: 'audio',
        durationSeconds: seconds,
      });

      cancelRecording();
    } catch (e) {
      console.error('Erro ao enviar mensagem de voz:', e);
      alert('Falha ao enviar o áudio. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (rawFile.type.startsWith('image/')) {
      const { compressedFile, previewUrl } = await compressImage(rawFile, {
        maxWidth: 1600,
        quality: 0.8,
      });
      setSelectedFile({
        file: compressedFile,
        url: previewUrl,
        type: 'image',
      });
    } else if (rawFile.type.startsWith('video/')) {
      setSelectedFile({
        file: rawFile,
        url: URL.createObjectURL(rawFile),
        type: 'video',
      });
    } else {
      setSelectedFile({
        file: rawFile,
        url: URL.createObjectURL(rawFile),
        type: 'document',
      });
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitMessageWithContent = async (
    textToSend: string,
    mediaDetails?: {
      mediaUrl?: string;
      mediaType?: MediaType;
      durationSeconds?: number;
    }
  ) => {
    if (!selectedConversationId || isSending) return;

    setIsSending(true);
    let bodyText = textToSend;
    let finalMediaUrl = mediaDetails?.mediaUrl;
    let finalMediaType = mediaDetails?.mediaType;
    let mediaSizeBytes: number | undefined;

    try {
      if (selectedFile) {
        bodyText += `\n📎 [Anexo: ${selectedFile.file.name}]`;
        const uploaded = await messagingService.uploadMedia(
          selectedFile.file,
          selectedFile.file.name,
          selectedFile.type
        );
        if (uploaded) {
          finalMediaUrl = uploaded.url;
          finalMediaType = selectedFile.type;
          mediaSizeBytes = uploaded.sizeBytes;
        } else {
          finalMediaUrl = selectedFile.url;
          finalMediaType = selectedFile.type;
        }
      }

      setNewMessageText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const clientMessageId = crypto.randomUUID();
      const tempMsg: Message = {
        id: 'temp-' + Date.now(),
        conversation_id: selectedConversationId,
        sender_type: isDentist ? 'dentist' : 'staff',
        sender_name: userContext.userName || (isDentist ? 'Dr(a). Dentista' : 'Recepção'),
        sender_user_id: userContext.userId,
        body: bodyText,
        client_message_id: clientMessageId,
        created_at: new Date().toISOString(),
        is_read: true,
        media_url: finalMediaUrl,
        media_type: finalMediaType,
        media_duration_seconds: mediaDetails?.durationSeconds,
        media_size_bytes: mediaSizeBytes,
      };

      setMessages((prev) => [...prev, tempMsg]);

      const sent = await messagingService.sendMessage(selectedConversationId, {
        body: bodyText,
        senderType: isDentist ? 'dentist' : 'staff',
        senderName: userContext.userName || 'Recepção Bertuol',
        senderUserId: userContext.userId,
        clientMessageId,
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaType,
        mediaDurationSeconds: mediaDetails?.durationSeconds,
        mediaSizeBytes,
      });

      if (sent) {
        setMessages((prev) => prev.map((m) => (m.client_message_id === clientMessageId ? sent : m)));
        loadConversations(true);
        loadMessages(selectedConversationId, true);
      } else {
        loadMessages(selectedConversationId, true);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!newMessageText.trim() && !selectedFile) || !selectedConversationId || isSending) return;
    await submitMessageWithContent(newMessageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Transferir
  const handleAssign = async (userId: string, userName: string) => {
    if (!selectedConversationId) return;
    const ok = await messagingService.assignConversation(
      selectedConversationId,
      userId,
      userName,
      userContext.userName || 'Recepção'
    );
    if (ok) {
      setIsAssignModalOpen(false);
      loadConversations(true);
      if (selectedConversationId) loadMessages(selectedConversationId, true);
    }
  };

  // Adicionar Dentista
  const handleAddParticipant = async (dentistId: number, dentistName: string) => {
    if (!selectedConversationId) return;
    const ok = await messagingService.addParticipant(
      selectedConversationId,
      String(dentistId),
      dentistName,
      'dentist',
      userContext.userName || 'Recepção'
    );
    if (ok) {
      setIsAddParticipantModalOpen(false);
      loadMessages(selectedConversationId, true);
    }
  };

  // Criar Nova Conversa
  const handleCreateNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConvPatientName.trim() || !newConvMessage.trim()) return;

    setIsSending(true);
    try {
      const res = await messagingService.createConversation({
        clinicId: newConvClinicId,
        patientName: newConvPatientName.trim(),
        patientPhone: newConvPatientPhone.trim(),
        subject: newConvSubject.trim() || 'Atendimento Bertuol Flow',
        initialMessage: newConvMessage.trim(),
        senderType: isDentist ? 'dentist' : 'staff',
        senderName: userContext.userName || 'Recepção Bertuol',
        senderUserId: userContext.userId,
      });

      if (res) {
        setIsNewConvModalOpen(false);
        setNewConvPatientName('');
        setNewConvPatientPhone('');
        setNewConvSubject('');
        setNewConvMessage('');
        await loadConversations(false);
        if (res.conversation?.id) {
          setSelectedConversationId(res.conversation.id);
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const filteredConversations = conversations.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.patient_name.toLowerCase().includes(q);
      const matchPhone = c.patient_phone?.toLowerCase().includes(q);
      const matchSubject = c.subject?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchSubject) return false;
    }
    return true;
  });

  const activeConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* HEADER */}
        <header className="bg-gradient-to-r from-[#147A80] via-[#126d72] to-[#0f5b5f] px-5 py-3.5 flex items-center justify-between text-white border-b border-teal-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
              <MessageSquare className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm tracking-tight text-white">
                  Central de Atendimento & Mensageria
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ao vivo
                </span>
              </div>
              <p className="text-xs text-teal-100/80 font-medium">
                {userContext.userName || 'Recepção Bertuol'} · Comunicação instantânea e segura com pacientes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNewConvModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white text-[#147A80] hover:bg-teal-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-[#147A80]" />
              <span className="hidden sm:inline">Nova Conversa</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CORPO DO CHAT */}
        <div className="flex-1 flex overflow-hidden bg-slate-900">
          
          {/* SIDEBAR DA ESQUERDA */}
          <aside className="w-full sm:w-80 md:w-96 border-r border-slate-800 bg-slate-900/90 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar paciente, fone ou assunto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-[#147A80]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                    scopeFilter === 'all'
                      ? 'bg-[#147A80] text-white shadow-2xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('mine')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                    scopeFilter === 'mine'
                      ? 'bg-[#147A80] text-white shadow-2xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Minhas
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('unassigned')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                    scopeFilter === 'unassigned'
                      ? 'bg-[#147A80] text-white shadow-2xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Não Atribuídas
                </button>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 font-medium text-[11px] cursor-pointer ml-auto"
                >
                  <option value="all">Status: Todos</option>
                  <option value="open">Abertas</option>
                  <option value="pending">Aguardando</option>
                  <option value="closed">Encerradas</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {isLoadingList ? (
                <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#147A80]" />
                  <span>Carregando atendimento...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-300">Nenhuma conversa encontrada</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Inicie um novo atendimento clicando em "Nova Conversa" acima.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedConversationId;
                  const timeStr = new Date(conv.last_message_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isUnassigned =
                    !conv.assigned_to_name ||
                    conv.assigned_to_name.toLowerCase().includes('recepção') ||
                    conv.assigned_to_name.toLowerCase().includes('recepcao');

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full p-3.5 text-left transition-all flex items-start gap-3 cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#147A80]/20 border-l-4 border-[#147A80]'
                          : 'hover:bg-slate-800/60 bg-slate-900/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#147A80] to-[#1FB5BD] text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
                        {conv.patient_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-100 truncate">
                            {conv.patient_name}
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {typeof conv.unread_count === 'number' && conv.unread_count > 0 && (
                              <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-bounce">
                                {conv.unread_count}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">{timeStr}</span>
                          </div>
                        </div>

                        <p className="text-[11px] font-semibold text-teal-400 truncate mb-1">
                          {conv.subject || 'Atendimento Bertuol'}
                        </p>

                        <p className="text-[11px] text-slate-400 truncate line-clamp-1 mb-2">
                          {conv.last_message_preview || 'Sem mensagens recentes'}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                conv.status === 'open'
                                  ? 'bg-emerald-400'
                                  : conv.status === 'pending'
                                  ? 'bg-amber-400'
                                  : 'bg-slate-600'
                              }`}
                            />
                            <span className="font-medium text-slate-400">
                              {conv.status === 'open'
                                ? 'Aberta'
                                : conv.status === 'pending'
                                ? 'Aguardando'
                                : 'Encerrada'}
                            </span>
                            <span>·</span>
                            <span className="text-slate-400">
                              {conv.clinic_id === 2 ? 'Paraíso' : 'Palmas'}
                            </span>
                          </div>

                          {isUnassigned ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <span>🔔</span>
                              <span>Pendente</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 truncate max-w-[120px] font-medium">
                              Resp: {conv.assigned_to_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* MAIN CHAT */}
          <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
            {activeConversation ? (
              <>
                {/* Header Chat */}
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-teal-950 border border-teal-800 text-teal-300 font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
                      {activeConversation.patient_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100 truncate">
                          {activeConversation.patient_name}
                        </h3>
                        {activeConversation.patient_phone && (
                          <span className="text-[11px] text-teal-300 font-mono bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-800/60">
                            {formatPhoneNumber(activeConversation.patient_phone)}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({activeConversation.clinic_id === 2 ? 'Paraíso' : 'Palmas'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="text-teal-400 font-semibold truncate">
                          {activeConversation.subject}
                        </span>
                        <span>·</span>
                        <span>
                          Responsável:{' '}
                          <strong className="text-slate-200">
                            {activeConversation.assigned_to_name || 'Recepção Geral'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeConversation.assigned_to_name !== currentDentistName && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAssign(
                            userContext.userId || 'usr_staff',
                            currentDentistName || userContext.userName || 'Profissional'
                          )
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-[#147A80] hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        title="Assumir este atendimento"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Assumir</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Transferir conversa"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline">Transferir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddParticipantModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl border border-teal-800 bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Adicionar Dentista"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                      <span className="hidden sm:inline">+ Dentista</span>
                    </button>
                  </div>
                </div>

                {/* MESSAGES FEED */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950">
                  <div className="text-center my-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                      Histórico da Conversa
                    </span>
                  </div>

                  {isLoadingMessages && messages.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#147A80]" />
                      <span>Carregando mensagens...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 space-y-2">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-700" />
                      <p className="text-xs font-medium">Nenhuma mensagem nesta conversa ainda.</p>
                      <p className="text-[11px] text-slate-600">Envie uma mensagem de texto ou áudio abaixo.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        msg.sender_type === 'staff' ||
                        msg.sender_type === 'dentist' ||
                        msg.sender_user_id === userContext.userId;
                      const timeStr = new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const { url: effectiveUrl, type: effectiveType } = getEffectiveMedia(msg);

                      return (
                        <div
                          key={msg.id || msg.client_message_id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-md relative transition-all ${
                              isMe
                                ? 'bg-gradient-to-br from-[#147A80] to-[#0f5b5f] text-white rounded-tr-xs border border-teal-700/60'
                                : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-xs'
                            }`}
                          >
                            {/* Remetente */}
                            <div className="flex items-center justify-between gap-3 mb-1 text-[11px] font-bold pb-1 border-b border-white/10">
                              <span className={isMe ? 'text-teal-200' : 'text-teal-400'}>
                                {msg.sender_name}
                              </span>
                              <span className={isMe ? 'text-teal-200/70 font-mono text-[10px]' : 'text-slate-500 font-mono text-[10px]'}>
                                {timeStr}
                              </span>
                            </div>

                            {/* Conteúdo de Texto */}
                            {cleanDisplayBody(msg.body, effectiveType === 'audio') && (
                              <p className="text-xs whitespace-pre-wrap leading-relaxed break-words font-medium">
                                {cleanDisplayBody(msg.body, effectiveType === 'audio')}
                              </p>
                            )}

                            {/* MÍDIA: Player Customizado de Áudio de Voz */}
                            {effectiveType === 'audio' && effectiveUrl && (
                              <AudioMessagePlayer
                                url={effectiveUrl}
                                durationSeconds={msg.media_duration_seconds}
                                isMe={isMe}
                              />
                            )}

                            {/* MÍDIA: Imagem */}
                            {effectiveType === 'image' && effectiveUrl && (
                              <div
                                onClick={() =>
                                  setActiveMediaView({
                                    isOpen: true,
                                    url: effectiveUrl,
                                    type: 'image',
                                    title: `Imagem enviada por ${msg.sender_name}`,
                                  })
                                }
                                className="mt-2.5 rounded-xl overflow-hidden border border-white/15 cursor-pointer max-w-sm group relative"
                              >
                                <img
                                  src={effectiveUrl}
                                  alt="Anexo de Imagem"
                                  className="w-full h-auto max-h-64 object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <ImageIcon className="w-4 h-4" />
                                  <span>Ampliar Imagem</span>
                                </div>
                              </div>
                            )}

                            {/* MÍDIA: Vídeo */}
                            {effectiveType === 'video' && effectiveUrl && (
                              <div className="mt-2.5 rounded-xl overflow-hidden border border-white/15 max-w-sm">
                                <video src={effectiveUrl} controls className="w-full h-auto max-h-64" />
                              </div>
                            )}

                            {/* MÍDIA: Documento */}
                            {effectiveType === 'document' && effectiveUrl && (
                              <div className="mt-2.5 p-2.5 bg-black/30 rounded-xl border border-white/15 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-5 h-5 text-teal-300 shrink-0" />
                                  <span className="font-bold truncate text-[11px]">
                                    {msg.body?.replace('📎 [Anexo: ', '').replace(']', '') || 'Documento Anexo'}
                                  </span>
                                </div>
                                <a
                                  href={effectiveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold shrink-0 transition-colors"
                                  title="Baixar Arquivo"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}

                            {/* Selo de Leitura */}
                            {isMe && (
                              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-teal-200/80">
                                <CheckCheck className="w-3.5 h-3.5 text-teal-300" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Respostas Prontas */}
                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                    Respostas Prontas:
                  </span>
                  {[
                    'Olá! Como podemos te ajudar hoje?',
                    'Seu agendamento foi confirmado com sucesso!',
                    'Aguardamos seu retorno para agendar sua consulta.',
                    'Qual o melhor dia e horário para você?',
                    'Qualquer dúvida estou à disposição!',
                  ].map((rep, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewMessageText(rep)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-900/60 border border-slate-700 text-slate-300 hover:text-teal-200 transition-colors whitespace-nowrap shrink-0 text-[11px] cursor-pointer"
                    >
                      {rep}
                    </button>
                  ))}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,video/*,audio/*"
                  className="hidden"
                />

                {/* COMPOSITOR E GRAVADOR */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3.5 border-t border-slate-800 bg-slate-900 shrink-0 space-y-2"
                >
                  {showMicPermissionBanner && (
                    <div className="p-3 bg-amber-950/80 border border-amber-800 rounded-xl text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-md">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <p className="font-bold text-amber-100">🔒 Permissão de Microfone Não Concedida</p>
                          <p className="text-[11px] text-amber-300">
                            Para gravar voz no navegador: clique no ícone de <strong>cadeado ou microfone</strong> na barra de endereço, selecione <strong>Permitir (Allow)</strong> e tente novamente.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-amber-800 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Anexar Áudio</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMicPermissionBanner(false);
                            startRecording();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Tentar Novamente
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMicPermissionBanner(false)}
                          className="p-1 text-amber-400 hover:text-white"
                          title="Fechar aviso"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedFile && (
                    <div className="flex items-center justify-between p-2 bg-teal-950/80 border border-teal-800 rounded-xl text-xs text-teal-200">
                      <div className="flex items-center gap-2 truncate">
                        {selectedFile.type === 'image' ? (
                          <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-teal-700">
                            <img src={selectedFile.url} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-teal-900 text-teal-300 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold truncate text-[11px]">{selectedFile.file.name}</p>
                          <p className="text-[10px] text-teal-400 font-medium">
                            {(selectedFile.file.size / 1024).toFixed(1)} KB · Pronto para envio
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover anexo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="relative bg-slate-950 border border-slate-800 rounded-2xl focus-within:ring-2 focus-within:ring-[#147A80] focus-within:border-transparent transition-all p-2 flex items-center gap-2">
                    {isRecording || recordedAudioUrl ? (
                      <div className="flex-1 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-rose-950/40 border border-rose-800/80 rounded-xl">
                        {isRecording && (
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                            <span className="text-xs font-mono font-bold text-rose-300">
                              {isPaused ? '⏸️ Gravação Pausada' : '🎙️ Gravando Áudio...'} 00:
                              {recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}
                            </span>
                          </div>
                        )}

                        {!isRecording && recordedAudioUrl && (
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <audio ref={previewAudioRef} src={recordedAudioUrl} onEnded={() => setIsPlayingPreview(false)} className="hidden" />
                            <button
                              type="button"
                              onClick={togglePreviewPlay}
                              className="p-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-rose-700"
                            >
                              {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              <span>{isPlayingPreview ? 'Pausar Prévia' : 'Ouvir Prévia'}</span>
                            </button>
                            <span className="text-xs font-mono text-rose-300 font-bold">
                              Duração: 00:{recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {isRecording && (
                            <>
                              {isPaused ? (
                                <button
                                  type="button"
                                  onClick={resumeRecording}
                                  className="px-2.5 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-teal-100 text-xs font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Retomar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={pauseRecording}
                                  className="px-2.5 py-1 rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>Pausar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={stopRecording}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1"
                              >
                                <span>Parar & Ouvir</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={cancelRecording}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 text-xs font-bold cursor-pointer"
                            title="Descartar gravação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={sendVoiceNote}
                            disabled={isSending}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Enviar Áudio</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 shrink-0 pl-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Anexar arquivo, imagem ou documento"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={startRecording}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Gravar mensagem de voz"
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          ref={textareaRef}
                          rows={1}
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Digite sua mensagem para o paciente..."
                          className="flex-1 py-1.5 px-2 text-xs text-slate-100 placeholder:text-slate-500 bg-transparent resize-none focus:outline-hidden max-h-24 font-medium"
                        />

                        <button
                          type="submit"
                          disabled={(!newMessageText.trim() && !selectedFile) || isSending}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#147A80] to-[#1FB5BD] hover:from-[#11696E] hover:to-[#147A80] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                    <span className="flex items-center gap-1">
                      <CornerDownLeft className="w-3 h-3 text-slate-500" />
                      <span>Enter envia, Shift+Enter pula linha</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span>📎 Anexos (Imagem, PDF)</span>
                      <span>·</span>
                      <span>🎙️ Áudio HD com Pausa/Prévia</span>
                    </span>
                  </div>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-300 shadow-sm">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-200">Selecione uma conversa</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Escolha um paciente na lista lateral para visualizar o histórico de mensagens, enviar áudios ou transferir o atendimento.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewConvModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#147A80] hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Criar Nova Conversa</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Media Viewer Modal */}
      <MediaViewerModal
        isOpen={activeMediaView.isOpen}
        onClose={() => setActiveMediaView({ ...activeMediaView, isOpen: false })}
        mediaUrl={activeMediaView.url}
        mediaType={activeMediaView.type}
        title={activeMediaView.title}
        patientName={activeConversation?.patient_name}
      />

      {/* MODAL 1: Transferir Atendimento */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-300">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <span>Transferir Atendimento</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Selecione o profissional ou setor que assumirá este paciente:
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-slate-800 pr-1">
              <button
                type="button"
                onClick={() => handleAssign('usr_reception', 'Recepção Geral')}
                className="w-full p-2.5 text-left rounded-xl hover:bg-slate-800 flex items-center justify-between text-xs font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <span>Recepção Geral / Triagem</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
              {dentists.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleAssign(String(d.id), d.Name)}
                  className="w-full p-2.5 text-left rounded-xl hover:bg-slate-800 flex items-center justify-between text-xs font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                    <div>
                      <p className="font-bold">{d.Name}</p>
                      {d.Specialty && <p className="text-[10px] text-slate-500">{d.Specialty}</p>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Adicionar Dentista */}
      {isAddParticipantModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-300">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span>Adicionar Dentista à Conversa</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddParticipantModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-slate-800 pr-1">
              {dentists.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleAddParticipant(d.id, d.Name)}
                  className="w-full p-2.5 text-left rounded-xl hover:bg-slate-800 flex items-center justify-between text-xs font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                    <div>
                      <p className="font-bold">{d.Name}</p>
                      {d.Specialty && <p className="text-[10px] text-slate-500">{d.Specialty}</p>}
                    </div>
                  </div>
                  <PlusCircle className="w-4 h-4 text-teal-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Criar Nova Conversa */}
      {isNewConvModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-300">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <span>Nova Conversa de Atendimento</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsNewConvModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewConversation} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Selecione Paciente Cadastrado:
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {TEST_PATIENTS.map((tp: any) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => {
                        setNewConvPatientName(tp.name);
                        setNewConvPatientPhone(tp.phone);
                        if (tp.clinicId) setNewConvClinicId(tp.clinicId);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-900/60 border border-slate-700 text-slate-300 text-[11px] font-medium whitespace-nowrap cursor-pointer shrink-0"
                    >
                      👤 {tp.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome do Paciente *</label>
                  <input
                    type="text"
                    required
                    value={newConvPatientName}
                    onChange={(e) => setNewConvPatientName(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-[#147A80]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={newConvPatientPhone}
                    onChange={(e) => setNewConvPatientPhone(e.target.value)}
                    placeholder="Ex: (63) 99247-4826"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-[#147A80]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Unidade da Clínica</label>
                <select
                  value={newConvClinicId}
                  onChange={(e) => setNewConvClinicId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-[#147A80]"
                >
                  <option value={1}>Unidade Palmas</option>
                  <option value={2}>Unidade Paraíso do Tocantins</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Assunto / Motivo</label>
                <input
                  type="text"
                  value={newConvSubject}
                  onChange={(e) => setNewConvSubject(e.target.value)}
                  placeholder="Ex: Alinhadores / Dúvida sobre agendamento"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-[#147A80]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mensagem Inicial *</label>
                <textarea
                  required
                  rows={3}
                  value={newConvMessage}
                  onChange={(e) => setNewConvMessage(e.target.value)}
                  placeholder="Digite a mensagem inicial para o paciente..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-[#147A80] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewConvModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 rounded-xl bg-[#147A80] hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Iniciar Conversa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
