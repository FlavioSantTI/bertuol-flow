import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  X,
  RefreshCw,
  PlusCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  Check,
  Building2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Paperclip,
  Mic,
  FileText,
  Trash2,
  Play,
  Pause,
  CornerDownLeft,
  Image as ImageIcon,
  CheckCheck,
  Download,
  Volume2,
} from 'lucide-react';
import { Conversation, Message } from '../../types/database';
import { messagingService } from '../../services/messagingService';
import { MediaViewerModal } from '../../components/MediaViewerModal';

interface PatientMessagingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone: string;
  clinicId?: number;
  initialCreateNew?: boolean;
  onResetCreateNew?: () => void;
}

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

export const PatientMessagingDrawer: React.FC<PatientMessagingDrawerProps> = ({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  clinicId = 1,
  initialCreateNew,
  onResetCreateNew,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [isCreatingNew, setIsCreatingNew] = useState(Boolean(initialCreateNew));
  const [newSubject, setNewSubject] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [newClinicId, setNewClinicId] = useState<number>(clinicId);

  const [newMessageText, setNewMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    url: string;
    type: 'image' | 'doc';
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Controles de Voz
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showMicPermissionBanner, setShowMicPermissionBanner] = useState(false);

  // Modal de Visualização de Mídia
  const [activeMediaView, setActiveMediaView] = useState<{
    isOpen: boolean;
    url: string;
    type: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    type: 'image',
    title: '',
  });

  const recordingTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCreateNew) {
      setIsCreatingNew(true);
    }
  }, [initialCreateNew]);

  const loadConversations = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoadingList(true);
      try {
        const data = await messagingService.getConversations({
          patientPhone,
          patientName,
          clinicId: 'all',
        });
        setConversations(data || []);
        if (data && data.length > 0) {
          setSelectedConversationId((prev) => {
            if (prev && data.some((c: Conversation) => c.id === prev)) {
              return prev;
            }
            return data[0].id;
          });
        }
      } catch (err) {
        console.error('[PatientDrawer] Erro ao carregar conversas:', err);
      } finally {
        if (!silent) setIsLoadingList(false);
      }
    },
    [patientPhone, patientName]
  );

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
        await messagingService.markAsRead(convId, 'patient');
      }
    } catch (err) {
      console.error('[PatientDrawer] Erro ao carregar mensagens:', err);
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
    }
  }, [selectedConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        console.warn('[Recording Patient] Fallback para MediaRecorder padrão:', recErr);
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
      console.error('[Recording Patient] Erro ao iniciar gravação:', err);
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
      const audioFile = new File([audioBlobToUpload], `audio_paciente_${Date.now()}.${extension}`, {
        type: mime,
      });

      const uploaded = await messagingService.uploadMedia(audioFile, audioFile.name, 'audio', seconds);
      const mediaUrl = uploaded?.url || '';

      if (!mediaUrl) {
        alert('Falha ao processar o áudio no servidor. Tente novamente.');
        return;
      }

      await submitMessage(`🎙️ [Mensagem de Voz • 00:${seconds < 10 ? '0' + seconds : seconds}]`, {
        mediaUrl,
        mediaType: 'audio',
        durationSeconds: seconds,
      });

      cancelRecording();
    } catch (e) {
      console.error('Erro ao enviar voz do paciente:', e);
      alert('Falha ao enviar a mensagem de voz. Tente novamente.');
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const url = URL.createObjectURL(file);
    setSelectedFile({
      file,
      url,
      type: isImg ? 'image' : 'doc',
    });
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitMessage = async (
    textToSend: string,
    mediaDetails?: {
      mediaUrl?: string;
      mediaType?: 'audio' | 'image' | 'video' | 'document';
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
          selectedFile.type === 'image' ? 'image' : 'document'
        );
        if (uploaded) {
          finalMediaUrl = uploaded.url;
          finalMediaType = selectedFile.type === 'image' ? 'image' : 'document';
          mediaSizeBytes = uploaded.sizeBytes;
        } else {
          finalMediaUrl = selectedFile.url;
          finalMediaType = selectedFile.type === 'image' ? 'image' : 'document';
        }
      }

      setNewMessageText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const clientMessageId = crypto.randomUUID();
      const tempMsg: Message = {
        id: 'temp-' + Date.now(),
        conversation_id: selectedConversationId,
        sender_type: 'patient',
        sender_name: patientName,
        sender_patient_id: patientPhone,
        body: bodyText,
        client_message_id: clientMessageId,
        created_at: new Date().toISOString(),
        is_read: true,
        media_url: finalMediaUrl,
        media_type: finalMediaType as any,
        media_duration_seconds: mediaDetails?.durationSeconds,
        media_size_bytes: mediaSizeBytes,
      };

      setMessages((prev) => [...prev, tempMsg]);

      const sent = await messagingService.sendMessage(selectedConversationId, {
        body: bodyText,
        senderType: 'patient',
        senderName: patientName,
        senderPatientId: patientPhone,
        clientMessageId,
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaType as any,
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
      console.error('Erro no envio de mensagem do paciente:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!newMessageText.trim() && !selectedFile) || !selectedConversationId || isSending) return;
    await submitMessage(newMessageText.trim());
  };

  const handleCreateNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInitialMsg.trim()) return;

    setIsSending(true);
    try {
      const res = await messagingService.createConversation({
        clinicId: newClinicId,
        patientName,
        patientPhone,
        subject: newSubject.trim() || 'Atendimento de Consulta',
        initialMessage: newInitialMsg.trim(),
        senderType: 'patient',
        senderName: patientName,
      });

      if (res) {
        setIsCreatingNew(false);
        if (onResetCreateNew) onResetCreateNew();
        setNewSubject('');
        setNewInitialMsg('');
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-800">
        
        {/* HEADER */}
        <div className="p-4 bg-gradient-to-r from-[#147A80] to-[#1FB5BD] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white">
                Fale com a Recepção & Clínica
              </h3>
              <p className="text-[11px] text-teal-100 font-medium">Bertuol Odontologia Avançada</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO */}
        {isCreatingNew ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  if (onResetCreateNew) onResetCreateNew();
                }}
                className="text-xs font-bold text-teal-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar às conversas</span>
              </button>
              <span className="text-xs font-bold text-slate-300">Nova Mensagem</span>
            </div>

            <form onSubmit={handleCreateNewConversation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Qual é o assunto?</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[
                    '🦷 Dúvida sobre Alinhadores',
                    '📅 Dúvida sobre Retorno',
                    '💊 Orientação / Pós-Consulta',
                    '💳 Dúvida Financeira',
                  ].map((sub, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewSubject(sub)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer ${
                        newSubject === sub
                          ? 'bg-[#147A80] border-teal-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ou digite outro assunto..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-[#147A80]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Unidade de Atendimento</label>
                <select
                  value={newClinicId}
                  onChange={(e) => setNewClinicId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-[#147A80]"
                >
                  <option value={1}>Unidade Palmas</option>
                  <option value={2}>Unidade Paraíso do Tocantins</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Sua Mensagem *</label>
                <textarea
                  required
                  rows={4}
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  placeholder="Digite sua dúvida ou mensagem detalhada..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-[#147A80] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || !newInitialMsg.trim()}
                className="w-full py-2.5 rounded-xl bg-[#147A80] hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Enviar para a Recepção</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* SELEÇÃO DE CONVERSA */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1 scrollbar-none">
                {conversations.map((c) => {
                  const isSel = c.id === selectedConversationId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConversationId(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isSel
                          ? 'bg-[#147A80] text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c.subject || 'Atendimento'}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="p-1.5 rounded-xl bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                title="Abrir novo tópico"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nova</span>
              </button>
            </div>

            {/* CHAT FEED */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#147A80]" />
                  <span>Carregando mensagens...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs font-bold text-slate-300">Nenhuma mensagem no momento</p>
                  <p className="text-[11px] text-slate-500">
                    Envie uma dúvida ou mensagem abaixo para nossa equipe de atendimento.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isPatientMsg = msg.sender_type === 'patient';
                  const timeStr = new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const { url: effectiveUrl, type: effectiveType } = getEffectiveMedia(msg);

                  return (
                    <div
                      key={msg.id || msg.client_message_id}
                      className={`flex flex-col ${isPatientMsg ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-sm relative transition-all ${
                          isPatientMsg
                            ? 'bg-[#147A80] text-white rounded-tr-xs border border-teal-600'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-bold pb-1 border-b border-white/10">
                          <span className={isPatientMsg ? 'text-teal-200' : 'text-teal-400'}>
                            {msg.sender_name}
                          </span>
                          <span className="text-slate-400 font-mono text-[9px]">{timeStr}</span>
                        </div>

                        {cleanDisplayBody(msg.body, effectiveType === 'audio') && <p className="text-xs whitespace-pre-wrap leading-relaxed">{cleanDisplayBody(msg.body, effectiveType === 'audio')}</p>}

                        {/* Mídia Áudio Customizado */}
                        {effectiveType === 'audio' && effectiveUrl && (
                          <AudioMessagePlayer
                            url={effectiveUrl}
                            durationSeconds={msg.media_duration_seconds}
                            isMe={isPatientMsg}
                          />
                        )}

                        {/* Mídia Imagem */}
                        {effectiveType === 'image' && effectiveUrl && (
                          <div className="mt-2.5 rounded-xl overflow-hidden border border-white/15 bg-black/40">
                            <img
                              src={effectiveUrl}
                              alt="Imagem Anexa"
                              onClick={() =>
                                setActiveMediaView({
                                  isOpen: true,
                                  url: effectiveUrl,
                                  type: 'image',
                                  title: `Imagem recebida`,
                                })
                              }
                              className="w-full h-auto max-h-52 object-cover cursor-pointer hover:scale-102 transition-transform duration-200"
                            />
                            <div className="flex items-center justify-between gap-2 p-2 bg-black/50 text-[11px] text-white">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMediaView({
                                    isOpen: true,
                                    url: effectiveUrl,
                                    type: 'image',
                                    title: `Imagem recebida`,
                                  })
                                }
                                className="flex items-center gap-1 hover:text-teal-300 transition-colors cursor-pointer font-bold"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-teal-300" />
                                <span>Visualizar</span>
                              </button>
                              <a
                                href={effectiveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all cursor-pointer shadow-xs text-[10px]"
                                title="Baixar Imagem"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Baixar</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Mídia Documento */}
                        {effectiveType === 'document' && effectiveUrl && (
                          <div className="mt-2.5 p-2.5 bg-black/30 rounded-xl border border-white/15 flex items-center justify-between gap-2.5 text-xs">
                            <div
                              onClick={() =>
                                setActiveMediaView({
                                  isOpen: true,
                                  url: effectiveUrl,
                                  type: 'document',
                                  title: `Documento de ${msg.sender_name}`,
                                })
                              }
                              className="flex items-center gap-2 truncate cursor-pointer flex-1 min-w-0 group"
                            >
                              <FileText className="w-4 h-4 text-teal-300 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate text-[11px] font-bold text-white group-hover:text-teal-200 transition-colors">
                                {msg.body?.replace(/📎\s*\[Anexo:\s*/i, '').replace(']', '') || 'Documento Anexo'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={effectiveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1 transition-all cursor-pointer text-[10px] shadow-xs"
                                title="Baixar Documento"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Baixar</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,audio/*"
              className="hidden"
            />

            {/* BARRA DE COMPOSIÇÃO DE MENSAGEM */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
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
                <div className="flex items-center justify-between p-2 bg-teal-950 border border-teal-800 rounded-xl text-xs text-teal-200">
                  <span className="truncate text-[11px]">Anexo: {selectedFile.file.name}</span>
                  <button type="button" onClick={removeSelectedFile} className="text-rose-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-2 flex items-center gap-2">
                {isRecording || recordedAudioUrl ? (
                  <div className="flex-1 flex items-center justify-between gap-2 px-2 py-1 bg-rose-950/40 border border-rose-800 rounded-xl text-xs">
                    {isRecording && (
                      <span className="text-rose-300 font-mono font-bold">
                        {isPaused ? '⏸️ Pausado' : '🎙️ Gravando'} 00:
                        {recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}
                      </span>
                    )}

                    {!isRecording && recordedAudioUrl && (
                      <div className="flex items-center gap-2">
                        <audio ref={previewAudioRef} src={recordedAudioUrl} onEnded={() => setIsPlayingPreview(false)} className="hidden" />
                        <button type="button" onClick={togglePreviewPlay} className="p-1 bg-rose-600 rounded text-white font-bold">
                          {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-[10px] text-rose-300 font-mono">Prévia</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      {isRecording && (
                        <button type="button" onClick={stopRecording} className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold">
                          Parar
                        </button>
                      )}
                      <button type="button" onClick={cancelRecording} className="p-1 text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={sendVoiceNote} className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-bold">
                        Enviar Áudio
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-teal-400 cursor-pointer"
                      title="Anexar foto ou documento"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Gravar mensagem de voz"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Digite sua dúvida ou resposta..."
                      className="flex-1 py-1 px-2 text-xs text-slate-100 placeholder:text-slate-500 bg-transparent focus:outline-hidden"
                    />

                    <button
                      type="submit"
                      disabled={(!newMessageText.trim() && !selectedFile) || isSending}
                      className="p-2 rounded-xl bg-[#147A80] hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </form>
          </>
        )}
      </div>

      {/* Modal de Visualização de Mídias (Imagem/Documento) para o Paciente */}
      <MediaViewerModal
        isOpen={activeMediaView.isOpen}
        onClose={() => setActiveMediaView({ ...activeMediaView, isOpen: false })}
        mediaUrl={activeMediaView.url}
        mediaType={activeMediaView.type}
        title={activeMediaView.title}
        patientName={patientName}
      />
    </div>
  );
};
